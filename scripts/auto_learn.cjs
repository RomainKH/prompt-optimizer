const fs = require('fs');
const path = require('path');

/**
 * Auto-learning engine for Prompt Optimizer (V4).
 *
 * Commands:
 *   log <original> <optimized> <removed...>           — Log an optimization and removed words
 *   candidate <word_or_phrase> <lang>                  — Log a suspected fluff word for review
 *   promote [threshold]                                — Auto-add frequent words to clean-patterns.md (default: 5)
 *   stats                                              — Show top removed words and savings summary
 *   dry-run <text> [severity]                          — Preview what would be removed (light|normal|aggressive)
 *   whitelist add <word_or_phrase>                     — Add a word to the whitelist (never removed)
 *   whitelist remove <word_or_phrase>                  — Remove a word from the whitelist
 *   whitelist list                                     — Show all whitelisted words
 *   decay [days]                                       — Decay stats for words not seen in N days (default: 30)
 */

const ASSETS_DIR = path.join(__dirname, '../assets');
const LOG_FILE = path.join(ASSETS_DIR, 'learning_log.json');
const WHITELIST_FILE = path.join(ASSETS_DIR, 'whitelist.json');
const PATTERNS_FILE = path.join(__dirname, '../references/clean-patterns.md');
const DEFAULT_PROMOTE_THRESHOLD = 5;
const DECAY_DEFAULT_DAYS = 30;

// --- Token Estimation ---
// More accurate than simple 1.3x multiplier.
// Uses character-based heuristic: avg English token ≈ 4 chars, French ≈ 3.8, Spanish ≈ 4.2
// Also accounts for punctuation as separate tokens.

function estimateTokens(text) {
    if (!text || !text.trim()) return 0;

    const words = text.split(/\s+/).filter(Boolean);
    let tokenCount = 0;

    for (const word of words) {
        // Punctuation-only tokens
        const punctuation = word.match(/[.,!?;:()[\]{}"'`—–\-\/\\]/g);
        const cleanWord = word.replace(/[.,!?;:()[\]{}"'`—–\-\/\\]/g, '');

        if (punctuation) tokenCount += punctuation.length;

        if (cleanWord.length === 0) continue;

        // Words up to ~7 chars are usually a single token; longer words get
        // split into ~4-char subword tokens.
        tokenCount += cleanWord.length <= 7 ? 1 : Math.ceil(cleanWord.length / 4);
    }

    return tokenCount;
}

function calculateCompression(original, optimized) {
    const originalTokens = estimateTokens(original);
    const optimizedTokens = estimateTokens(optimized);
    const saved = Math.max(0, originalTokens - optimizedTokens);
    const ratio = originalTokens > 0 ? ((saved / originalTokens) * 100).toFixed(1) : '0.0';
    return { saved, ratio, originalTokens, optimizedTokens };
}

// --- Pattern matching ---
// Build a Unicode-aware, word-boundary regex for a fluff word or phrase.
// Using \p{L}\p{N} lookarounds (instead of \b, which is ASCII-only) prevents
// substring false positives — e.g. "just" must NOT match "adjust", "very" must
// NOT match "everyday" — while still handling accented letters (é, ñ, ü…).
function makeRegex(word, { global = false } = {}) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = (global ? 'g' : '') + 'iu';
    return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, flags);
}

// --- Helpers ---

function ensureAssets() {
    if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

function loadLog() {
    ensureAssets();
    if (!fs.existsSync(LOG_FILE)) {
        return { stats: {}, candidates: {}, promoted: [], history: [], totalTokensSaved: 0 };
    }
    const data = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    if (!data.candidates) data.candidates = {};
    if (!data.promoted) data.promoted = [];
    if (!data.stats) data.stats = {};
    if (!data.history) data.history = [];
    if (!data.totalTokensSaved) data.totalTokensSaved = 0;
    return data;
}

function saveLog(log) {
    ensureAssets();
    fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

function loadWhitelist() {
    ensureAssets();
    if (!fs.existsSync(WHITELIST_FILE)) return [];
    return JSON.parse(fs.readFileSync(WHITELIST_FILE, 'utf8'));
}

function saveWhitelist(list) {
    ensureAssets();
    fs.writeFileSync(WHITELIST_FILE, JSON.stringify(list, null, 2));
}

function loadPatterns() {
    if (!fs.existsSync(PATTERNS_FILE)) return {};
    const content = fs.readFileSync(PATTERNS_FILE, 'utf8');
    const patterns = {};
    let currentLang = null;
    let currentCategory = null;
    let inPromoted = false;

    const addWord = (lang, category, word) => {
        if (!patterns[lang]) patterns[lang] = {};
        if (!patterns[lang][category]) patterns[lang][category] = [];
        if (!patterns[lang][category].includes(word)) patterns[lang][category].push(word);
    };

    for (const line of content.split('\n')) {
        // The auto-promoted section uses a different line format than the
        // hand-written language sections — parse it so the engine actually
        // re-uses what it has learned (otherwise promotions are write-only).
        if (line.startsWith('## Learned Patterns (Auto-promoted)')) {
            inPromoted = true;
            currentLang = null;
            continue;
        }

        // Detect language header: ## French (FR)
        const langMatch = line.match(/^## (\w+) \((\w+)\)/);
        if (langMatch) {
            inPromoted = false;
            currentLang = langMatch[2].toLowerCase();
            patterns[currentLang] = patterns[currentLang] || {};
            continue;
        }

        if (inPromoted) {
            // - "word" (removed 5x) [FR]   — lang-tagged
            // - "word" (removed 5x)        — language-agnostic (bucket '*')
            const m = line.match(/^- "([^"]+)"(?:.*?\[(\w+)\])?/);
            if (m) {
                const lang = m[2] ? m[2].toLowerCase() : '*';
                addWord(lang, 'learned', m[1].toLowerCase());
            }
            continue;
        }

        if (!currentLang) continue;

        // Detect category: - **Politeness:** "word1", "word2"
        const catMatch = line.match(/^- \*\*(.+?):\*\*\s*(.+)/);
        if (catMatch) {
            currentCategory = catMatch[1].toLowerCase();
            const words = catMatch[2].match(/"([^"]+)"/g);
            if (words) {
                patterns[currentLang][currentCategory] = words.map(w => w.replace(/"/g, '').toLowerCase());
            }
        }
    }
    return patterns;
}

// Severity levels define which categories to remove
// 'learned' = auto-promoted words; always active since they were confirmed fluff.
const SEVERITY_CATEGORIES = {
    light: ['politeness', 'abbreviations', 'abbreviations/slang', 'closing/filler', 'learned'],
    normal: ['politeness', 'abbreviations', 'abbreviations/slang', 'hesitations/fillers',
             'closing/filler', 'vague intensifiers', 'unnecessary justifications', 'learned'],
    aggressive: ['politeness', 'abbreviations', 'abbreviations/slang', 'hesitations/fillers',
                 'closing/filler', 'vague intensifiers', 'unnecessary justifications',
                 'fake power phrases', 'meta-comments & parentheticals', 'learned']
};

function detectLanguage(text) {
    // Pad with spaces and collapse whitespace so " word " markers also match at
    // the very start/end of the prompt (previously "Tu peux…" missed " tu ").
    const lower = ` ${text.toLowerCase().replace(/\s+/g, ' ')} `;
    const scores = { fr: 0, en: 0, es: 0, it: 0 };

    // French markers
    [' je ', ' tu ', ' que ', 'est-ce', ' le ', ' la ', ' les ', ' un ', ' une ', ' du ', ' des ', ' nous ', ' vous '].forEach(m => {
        if (lower.includes(m)) scores.fr += 2;
    });
    if (/[éèêëàùçôîû]/.test(lower)) scores.fr += 3;

    // English markers
    [' the ', ' is ', ' are ', ' you ', ' can ', ' would ', ' this ', ' have ', ' do ', ' my '].forEach(m => {
        if (lower.includes(m)) scores.en += 2;
    });

    // Spanish markers
    [' el ', ' los ', ' las ', ' que ', ' es ', ' yo ', ' tú ', ' usted ', ' pero ', ' también ',
     'hola', 'gracias', 'por favor', 'podrías', 'puedes', 'quiero', 'necesito', 'ayuda', 'cómo'].forEach(m => {
        if (lower.includes(m)) scores.es += 2;
    });
    if (/[ñ¿¡]/.test(lower)) scores.es += 3;

    // Italian markers
    [' il ', ' lo ', ' gli ', ' che ', ' sono ', ' questo ', ' anche ', ' perché ', ' della '].forEach(m => {
        if (lower.includes(m)) scores.it += 2;
    });

    const best = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const top = best[0][1];
    if (top === 0) return ['en']; // no markers matched → default to English

    // Always keep the dominant language. Add secondary languages only when they
    // score close to the top (≥60%) — this preserves genuine mixed-language
    // prompts (e.g. FR+EN) while ignoring incidental shared markers like "que",
    // which is both French and Spanish and used to flag ES on pure-French text.
    const detected = best
        .filter(([, score]) => score === top || score >= top * 0.6)
        .map(([lang]) => lang);
    return detected;
}

// --- Commands ---

function cmdLog(original, optimized, removed) {
    const log = loadLog();
    const compression = calculateCompression(original, optimized);
    const whitelist = loadWhitelist();

    // Filter out whitelisted words
    const filtered = removed.filter(w => !whitelist.includes(w.toLowerCase().trim()));

    filtered.forEach(word => {
        const key = word.toLowerCase().trim();
        if (!key) return;
        if (!log.stats[key]) {
            log.stats[key] = { count: 0, lastSeen: null };
        }
        log.stats[key].count += 1;
        log.stats[key].lastSeen = new Date().toISOString();
    });

    log.totalTokensSaved += compression.saved;

    log.history.push({
        date: new Date().toISOString(),
        original,
        optimized,
        removed: filtered,
        saved: compression.saved,
        ratio: compression.ratio
    });

    if (log.history.length > 200) log.history.shift();
    saveLog(log);

    // Check for promotion-ready words
    const readyToPromote = Object.entries(log.stats)
        .filter(([word, data]) => data.count >= DEFAULT_PROMOTE_THRESHOLD && !log.promoted.includes(word))
        .map(([word]) => word);

    console.log(`\n✨ Optimization Success!`);
    console.log(`📉 Compression: -${compression.ratio}%`);
    console.log(`📊 Tokens: ${compression.originalTokens} → ${compression.optimizedTokens} (saved ${compression.saved})`);
    console.log(`💾 Total saved all time: ${log.totalTokensSaved} tokens`);

    if (readyToPromote.length > 0) {
        console.log(`\n🔔 ${readyToPromote.length} word(s) ready for auto-promotion (≥${DEFAULT_PROMOTE_THRESHOLD}x):`);
        readyToPromote.forEach(w => console.log(`   → "${w}" (${log.stats[w].count}x)`));
        console.log(`   Run: node scripts/auto_learn.cjs promote`);
    }
}

function cmdCandidate(phrase, lang) {
    const log = loadLog();
    const key = phrase.toLowerCase().trim();
    if (!key) { console.log('❌ Please provide a word or phrase.'); return; }

    if (!log.candidates[key]) {
        log.candidates[key] = { count: 0, lang: lang || 'unknown', firstSeen: new Date().toISOString() };
    }
    log.candidates[key].count += 1;
    log.candidates[key].lastSeen = new Date().toISOString();
    saveLog(log);

    console.log(`\n🔍 Candidate logged: "${key}" (${log.candidates[key].lang}) — seen ${log.candidates[key].count}x`);
    if (log.candidates[key].count >= DEFAULT_PROMOTE_THRESHOLD) {
        console.log(`   ⚡ Ready for promotion! Run: node scripts/auto_learn.cjs promote`);
    }
}

function cmdPromote(threshold) {
    const t = threshold || DEFAULT_PROMOTE_THRESHOLD;
    const log = loadLog();

    const fromStats = Object.entries(log.stats)
        .filter(([word, data]) => data.count >= t && !log.promoted.includes(word))
        .map(([word, data]) => ({ word, count: data.count, source: 'stats' }));

    const fromCandidates = Object.entries(log.candidates)
        .filter(([word, data]) => data.count >= t && !log.promoted.includes(word))
        .map(([word, data]) => ({ word, count: data.count, lang: data.lang, source: 'candidate' }));

    const toPromote = [...fromStats, ...fromCandidates];

    if (toPromote.length === 0) {
        console.log(`\n✅ Nothing to promote. All frequent words (≥${t}x) are already in patterns.`);
        return;
    }

    let patternsContent = fs.readFileSync(PATTERNS_FILE, 'utf8');
    const SECTION_HEADER = '## Learned Patterns (Auto-promoted)';

    if (!patternsContent.includes(SECTION_HEADER)) {
        patternsContent += `\n${SECTION_HEADER}\n\nThese patterns were automatically added after being removed ≥${t} times by users.\n\n`;
    }

    const promoted = [];
    toPromote.forEach(({ word, count, lang }) => {
        const langLabel = lang && lang !== 'unknown' ? ` [${lang.toUpperCase()}]` : '';
        const line = `- "${word}" (removed ${count}x)${langLabel}`;
        if (!patternsContent.includes(`"${word}"`)) {
            patternsContent += `${line}\n`;
            promoted.push(word);
            log.promoted.push(word);
        }
    });

    if (promoted.length > 0) {
        fs.writeFileSync(PATTERNS_FILE, patternsContent);
        saveLog(log);
        console.log(`\n🚀 Promoted ${promoted.length} pattern(s):`);
        promoted.forEach(w => console.log(`   ✅ "${w}"`));
    } else {
        console.log(`\n✅ All candidates already in patterns.`);
    }
}

function cmdStats() {
    const log = loadLog();
    const whitelist = loadWhitelist();

    console.log('\n📊 Prompt Optimizer — Usage Statistics\n');
    console.log('━'.repeat(55));

    console.log(`\n💾 Total tokens saved: ${log.totalTokensSaved}`);
    console.log(`📝 Total optimizations: ${log.history.length}`);

    if (log.history.length > 0) {
        const avgRatio = (log.history.reduce((sum, h) => sum + parseFloat(h.ratio), 0) / log.history.length).toFixed(1);
        console.log(`📉 Average compression: -${avgRatio}%`);

        // Tokens per day (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const recentSaved = log.history.filter(h => h.date > weekAgo).reduce((sum, h) => sum + h.saved, 0);
        console.log(`📅 Tokens saved (last 7 days): ${recentSaved}`);
    }

    // Top 15 removed words
    const sorted = Object.entries(log.stats)
        .map(([word, data]) => [word, typeof data === 'number' ? data : data.count])
        .sort((a, b) => b[1] - a[1]);

    if (sorted.length > 0) {
        console.log(`\n🏆 Top ${Math.min(15, sorted.length)} most removed:\n`);
        const maxCount = sorted[0][1];
        sorted.slice(0, 15).forEach(([word, count], i) => {
            const barLen = Math.max(1, Math.round((count / maxCount) * 20));
            const bar = '█'.repeat(barLen);
            console.log(`   ${String(i + 1).padStart(2)}. "${word}" — ${count}x ${bar}`);
        });
    }

    // Candidates
    const pendingCandidates = Object.entries(log.candidates)
        .filter(([word]) => !log.promoted.includes(word))
        .sort((a, b) => b[1].count - a[1].count);

    if (pendingCandidates.length > 0) {
        console.log(`\n🔍 Pending candidates (${pendingCandidates.length}):\n`);
        pendingCandidates.slice(0, 10).forEach(([word, data]) => {
            const status = data.count >= DEFAULT_PROMOTE_THRESHOLD ? '⚡ ready' : `${data.count}/${DEFAULT_PROMOTE_THRESHOLD}`;
            console.log(`   → "${word}" [${data.lang}] — ${status}`);
        });
    }

    if (log.promoted.length > 0) {
        console.log(`\n✅ Promoted: ${log.promoted.length} pattern(s)`);
    }

    if (whitelist.length > 0) {
        console.log(`\n🛡️  Whitelisted: ${whitelist.join(', ')}`);
    }

    console.log('\n' + '━'.repeat(55));
}

function cmdDryRun(text, severity) {
    const sev = severity || 'normal';
    const categories = SEVERITY_CATEGORIES[sev];

    if (!categories) {
        console.log(`❌ Unknown severity: "${sev}". Use: light, normal, or aggressive.`);
        return;
    }

    const langs = detectLanguage(text);
    const patterns = loadPatterns();
    const whitelist = loadWhitelist();
    const log = loadLog();

    console.log(`\n🔍 Dry-run analysis (severity: ${sev})`);
    console.log(`🌍 Detected language(s): ${langs.map(l => l.toUpperCase()).join(', ')}`);
    console.log(`📋 Active categories: ${categories.join(', ')}`);
    console.log('');

    const found = [];

    // Check static patterns. '*' holds language-agnostic auto-promoted words.
    for (const lang of [...langs, '*']) {
        if (!patterns[lang]) continue;
        for (const [category, words] of Object.entries(patterns[lang])) {
            if (!categories.includes(category)) continue;
            for (const word of words) {
                if (whitelist.includes(word)) continue;
                if (makeRegex(word).test(text) && !found.some(f => f.word === word)) {
                    const label = lang === '*' ? 'learned/all' : `patterns/${lang}/${category}`;
                    found.push({ word, source: label, type: category === 'learned' ? 'learned' : 'static' });
                }
            }
        }
    }

    // Check learned stats (≥3 occurrences)
    for (const [word, data] of Object.entries(log.stats)) {
        const count = typeof data === 'number' ? data : data.count;
        if (count >= 3 && !whitelist.includes(word)) {
            if (makeRegex(word).test(text) && !found.some(f => f.word === word)) {
                found.push({ word, source: `learned (${count}x)`, type: 'learned' });
            }
        }
    }

    // Drop sub-phrases already covered by a longer matched phrase, so we don't
    // double-count (e.g. "could you" inside "could you please") or leave orphan
    // fragments in the preview. Longest-match wins.
    const deduped = found.filter(f =>
        !found.some(other => other !== f
            && other.word.length > f.word.length
            && makeRegex(f.word).test(other.word))
    );
    found.length = 0;
    found.push(...deduped);

    if (found.length === 0) {
        console.log('✅ No fluff detected at this severity level.');
    } else {
        console.log(`🗑️  Would remove ${found.length} pattern(s):\n`);
        found.forEach(({ word, source, type }) => {
            const icon = type === 'static' ? '📖' : '🧠';
            console.log(`   ${icon} "${word}" — ${source}`);
        });

        // Estimate compression
        let cleaned = text;
        found.forEach(({ word }) => {
            cleaned = cleaned.replace(makeRegex(word, { global: true }), '');
        });
        // Tidy leftover spacing and punctuation orphaned by removed clauses:
        // collapse runs of punctuation, drop space-before-punctuation and
        // leading/trailing commas.
        cleaned = cleaned
            .replace(/\s+([.,!?;:])/g, '$1')           // " ," -> ","
            .replace(/([.,!?;:])\s*([.,!?;:])+/g, '$1') // ",," / ", ." -> ","
            .replace(/\s{2,}/g, ' ')
            .replace(/^[\s,;:]+|[\s,;:]+$/g, '')         // trim edge punctuation
            .trim();

        const compression = calculateCompression(text, cleaned);
        console.log(`\n📉 Estimated compression: -${compression.ratio}%`);
        console.log(`📊 Tokens: ${compression.originalTokens} → ${compression.optimizedTokens}`);
        console.log(`\n💡 Preview:`);
        console.log(`   "${cleaned}"`);
    }
}

function cmdWhitelist(action, phrase) {
    const whitelist = loadWhitelist();

    switch (action) {
        case 'add': {
            const key = phrase.toLowerCase().trim();
            if (!key) { console.log('❌ Please provide a word or phrase.'); return; }
            if (whitelist.includes(key)) {
                console.log(`ℹ️  "${key}" is already whitelisted.`);
                return;
            }
            whitelist.push(key);
            saveWhitelist(whitelist);
            console.log(`\n🛡️  Added "${key}" to whitelist. It will never be removed during optimization.`);
            break;
        }
        case 'remove': {
            const key = phrase.toLowerCase().trim();
            const idx = whitelist.indexOf(key);
            if (idx === -1) {
                console.log(`ℹ️  "${key}" is not in the whitelist.`);
                return;
            }
            whitelist.splice(idx, 1);
            saveWhitelist(whitelist);
            console.log(`\n🗑️  Removed "${key}" from whitelist.`);
            break;
        }
        case 'list': {
            if (whitelist.length === 0) {
                console.log('\n🛡️  Whitelist is empty. All patterns will be removed during optimization.');
            } else {
                console.log(`\n🛡️  Whitelisted words (${whitelist.length}):\n`);
                whitelist.forEach(w => console.log(`   • "${w}"`));
            }
            break;
        }
        default: {
            console.log('Usage: whitelist <add|remove|list> [word_or_phrase]');
            break;
        }
    }
}

function cmdDecay(days) {
    const d = days || DECAY_DEFAULT_DAYS;
    const log = loadLog();
    const cutoff = new Date(Date.now() - d * 86400000).toISOString();
    let decayed = 0;
    let removed = 0;

    for (const [word, data] of Object.entries(log.stats)) {
        // Migrate old format (plain number)
        if (typeof data === 'number') {
            log.stats[word] = { count: data, lastSeen: null };
            continue;
        }

        if (!data.lastSeen || data.lastSeen < cutoff) {
            // Halve the count for stale entries
            const oldCount = data.count;
            data.count = Math.floor(data.count / 2);

            if (data.count === 0) {
                delete log.stats[word];
                removed++;
            } else {
                decayed++;
            }
        }
    }

    // Also decay candidates
    for (const [word, data] of Object.entries(log.candidates)) {
        if (!data.lastSeen || data.lastSeen < cutoff) {
            data.count = Math.floor(data.count / 2);
            if (data.count === 0) {
                delete log.candidates[word];
                removed++;
            } else {
                decayed++;
            }
        }
    }

    saveLog(log);

    console.log(`\n🕐 Decay applied (cutoff: ${d} days ago)`);
    console.log(`   📉 Decayed: ${decayed} entries (count halved)`);
    console.log(`   🗑️  Removed: ${removed} entries (count reached 0)`);
}

// --- Module exports (for tests / benchmarking) ---
// When required instead of run directly, expose the pure helpers so token
// savings can be measured programmatically without touching the CLI.
if (require.main !== module) {
    module.exports = {
        estimateTokens,
        calculateCompression,
        detectLanguage,
        makeRegex,
        loadPatterns,
    };
    return;
}

// --- CLI Router ---

const [command, ...args] = process.argv.slice(2);

switch (command) {
    case 'log': {
        const [original, optimized, ...removed] = args;
        if (!original || !optimized) {
            console.log('Usage: node auto_learn.cjs log "<original>" "<optimized>" [removed_words...]');
            process.exit(1);
        }
        cmdLog(original, optimized, removed);
        break;
    }
    case 'candidate': {
        const [phrase, lang] = args;
        if (!phrase) {
            console.log('Usage: node auto_learn.cjs candidate "<word_or_phrase>" [lang]');
            process.exit(1);
        }
        cmdCandidate(phrase, lang);
        break;
    }
    case 'promote': {
        cmdPromote(args[0] ? parseInt(args[0], 10) : undefined);
        break;
    }
    case 'stats': {
        cmdStats();
        break;
    }
    case 'dry-run': {
        const [text, severity] = args;
        if (!text) {
            console.log('Usage: node auto_learn.cjs dry-run "<text>" [light|normal|aggressive]');
            process.exit(1);
        }
        cmdDryRun(text, severity);
        break;
    }
    case 'whitelist': {
        const [action, ...rest] = args;
        cmdWhitelist(action, rest.join(' '));
        break;
    }
    case 'decay': {
        cmdDecay(args[0] ? parseInt(args[0], 10) : undefined);
        break;
    }
    default: {
        console.log('Prompt Optimizer — Auto-Learning Engine V4\n');
        console.log('Commands:');
        console.log('  log <original> <optimized> <removed...>     Log an optimization');
        console.log('  candidate <phrase> [lang]                    Log a suspected fluff word');
        console.log('  promote [threshold]                          Auto-add frequent words to patterns');
        console.log('  stats                                        Show usage statistics');
        console.log('  dry-run <text> [light|normal|aggressive]     Preview what would be removed');
        console.log('  whitelist add|remove|list [word]             Manage protected words');
        console.log('  decay [days]                                 Decay old stats (default: 30 days)');
        break;
    }
}

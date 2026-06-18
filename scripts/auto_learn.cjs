const fs = require('fs');
const path = require('path');

/**
 * Script d'auto-apprentissage V2 pour le Prompt Optimizer.
 * Enregistre les mots supprimés et calcule le taux de compression.
 */

const logFile = path.join(__dirname, '../assets/learning_log.json');

function loadLog() {
    if (!fs.existsSync(logFile)) return { stats: {}, history: [], totalTokensSaved: 0 };
    return JSON.parse(fs.readFileSync(logFile, 'utf8'));
}

function saveLog(log) {
    fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
}

function calculateCompression(original, optimized) {
    // Estimation simplifiée : 1 mot ≈ 1.3 tokens
    const originalTokens = original.split(/\s+/).length * 1.3;
    const optimizedTokens = optimized.split(/\s+/).length * 1.3;
    const saved = Math.max(0, originalTokens - optimizedTokens);
    const ratio = ((saved / originalTokens) * 100).toFixed(1);
    return { saved: Math.round(saved), ratio };
}

function logAction(original, optimized, removed) {
    const log = loadLog();
    const stats = calculateCompression(original, optimized);
    
    removed.forEach(word => {
        log.stats[word] = (log.stats[word] || 0) + 1;
    });
    
    log.totalTokensSaved += stats.saved;
    
    log.history.push({
        date: new Date().toISOString(),
        original,
        optimized,
        removed,
        saved: stats.saved,
        ratio: stats.ratio
    });
    
    if (log.history.length > 100) log.history.shift();
    
    saveLog(log);
    
    console.log(`\n✨ Optimization Success!`);
    console.log(`📉 Compression: -${stats.ratio}% tokens`);
    console.log(`💾 Estimated savings: ${stats.saved} tokens (Total saved: ${log.totalTokensSaved})`);
}

const args = process.argv.slice(2);
if (args[0] === 'log') {
    const [_, original, optimized, ...removed] = args;
    logAction(original, optimized, removed);
}

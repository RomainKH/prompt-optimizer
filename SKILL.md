---
name: prompt-optimizer
description: Optimizes user prompts by removing fluff (politeness, fillers, unnecessary context) to reduce token usage and improve clarity. Features self-learning, severity levels, whitelist, and multi-language support.
---

# Prompt Optimizer (v1.1.0)

This skill transforms verbose user queries into direct, high-signal instructions for an AI.

## Core Principles

1. **Intent Extraction:** Identify the core action (e.g., "code", "summarize", "analyze").
2. **Fluff Removal:** Strip away politeness markers, hesitant intros, and justifications that don't influence the technical outcome.
3. **Structure Preservation:** Keep proper syntax (subject + verb + object) to ensure the target AI understands nuances, unlike a pure "Caveman" mode.

## Severity Levels

The optimizer supports 3 severity levels. Default is `normal`.

| Level | What gets removed | Use case |
|-------|------------------|----------|
| `light` | Politeness, abbreviations, closing fillers | Customer-facing text, emails |
| `normal` | Light + hesitations, intensifiers, unnecessary justifications | General prompts |
| `aggressive` | Normal + fake power phrases, meta-comments, all parentheticals | Maximum token savings |

When the user specifies a severity (e.g., "optimize light: ..."), apply only the matching categories from [clean-patterns.md](references/clean-patterns.md).

## Whitelist

Some words should never be removed, even if they match a fluff pattern. Check `assets/whitelist.json` before removing any word. If a word is whitelisted, skip it.

Manage the whitelist:
```
scripts/auto_learn.cjs whitelist add "please"      # protect a word
scripts/auto_learn.cjs whitelist remove "please"   # unprotect
scripts/auto_learn.cjs whitelist list              # show all
```

## Language Detection

Detect the user's language by checking for these markers. **A prompt can be multi-language** — check all languages and apply patterns from each detected language.

- **French:** presence of "je", "tu", "que", "est-ce", "le/la/les", accented characters (é, è, ê, à, ù, ç)
- **English:** presence of "the", "is", "are", "I", "you", "can", "would", "this"
- **Spanish:** presence of "el/la/los/las", "que", "es", "yo", "tú", inverted punctuation (¿, ¡)
- **Italian:** presence of "il/lo/la/i/gli/le", "che", "è", "sono", "mi", "un/una"

If multiple languages score > 0, apply patterns from ALL detected languages.

## Workflow

When asked to optimize a prompt:

### Step 1 — Analyze
1. Detect the language(s) using the markers above.
2. Determine severity level: `light`, `normal` (default), or `aggressive`.
3. Consult [clean-patterns.md](references/clean-patterns.md) for known fluff patterns.
4. Check learned stats in `assets/learning_log.json` → `stats`. **If a word has count ≥3, treat it as confirmed fluff.**
5. Check `assets/whitelist.json` — **never remove whitelisted words**.

### Step 2 — Dry-run (optional)
If the user asks for a preview, or you want to verify before optimizing:
```
scripts/auto_learn.cjs dry-run "the full prompt text" normal
```
This shows what would be removed without changing anything.

### Step 3 — Optimize
1. Rewrite the request using imperative or infinitive verbs.
2. Remove all matched patterns (from `clean-patterns.md` AND learned stats), respecting severity level and whitelist.
3. If you detect a word/phrase that looks like fluff but is **not** in the patterns file, log it as a candidate:
   ```
   scripts/auto_learn.cjs candidate "the phrase" "lang_code"
   ```

### Step 4 — Log & Report
1. Execute the logging command:
   ```
   scripts/auto_learn.cjs log "original phrase" "optimized phrase" "removed1" "removed2"
   ```
2. If words are ready for promotion, run:
   ```
   scripts/auto_learn.cjs promote
   ```

### Step 5 — Output
Provide the optimized prompt along with:
- The severity level used
- The compression ratio (e.g., -45%)
- The estimated tokens saved
- Any new candidates detected
- Whitelisted words that were preserved (if any matched)

## Self-Learning System

The optimizer gets smarter over time through a 3-tier learning pipeline:

### Tier 1 — Static Patterns (Immediate)
Known fluff words in `references/clean-patterns.md`. Always removed on first sight (if severity allows).

### Tier 2 — Learned Stats (Adaptive)
Words tracked in `assets/learning_log.json` → `stats`. Each entry tracks count and lastSeen date.
- **≥3 occurrences:** Confirmed fluff — remove systematically.
- **1-2 occurrences:** Remove only if clearly fluff in context.

### Tier 3 — Candidates (Discovery)
New words detected by the AI as probable fluff.
- Below threshold: observed only.
- At threshold (≥5): promoted to `clean-patterns.md` via `promote`.

### Stats Decay
To prevent old/irrelevant patterns from accumulating, run periodically:
```
scripts/auto_learn.cjs decay 30
```
Words not seen in 30 days get their count halved. Words that reach 0 are removed entirely.

### Usage Statistics
To see a dashboard of habits, top removed words, and savings:
```
scripts/auto_learn.cjs stats
```

## Examples

### Normal severity (default)
- **Input (FR):** "Salut ! Est-ce que tu pourrais m'écrire un petit mail pour mon boss pour lui dire que je serai en retard demain matin s'il te plaît ? Merci beaucoup !"
- **Output:** "Rédige un email professionnel informant mon manager de mon retard demain matin."
- **Stats:** -45% tokens

### Aggressive severity
- **Input (EN):** "Hey, I was wondering if you could please help me analyze this dataset carefully and find the average price, it's very important for my study, I've been struggling with it. Thanks a lot!"
- **Output:** "Analyze this dataset. Calculate average price."
- **Stats:** -70% tokens

### Light severity
- **Input (ES):** "Hola, buenas, mira quería preguntarte si podrías ayudarme a escribir un correo para mi jefe por favor, es que es muy importante, gracias de antemano."
- **Output:** "Quería preguntarte si podrías ayudarme a escribir un correo para mi jefe, es muy importante."
- **Stats:** -30% tokens

### Mixed language
- **Input (FR+EN):** "Hey, est-ce que tu peux me write a function qui parse le JSON s'il te plaît ?"
- **Output:** "Write a function to parse JSON."
- **Stats:** -55% tokens

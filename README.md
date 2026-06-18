# Prompt Optimizer Skill (v1.1.0)

An intelligent skill that strips "prompt fluff" (politeness, fillers, unnecessary context) to reduce token consumption and improve LLM instruction clarity. Self-learning, multi-platform, multilingual.

## 📉 Performance — real prompts, measured before/after

The table below uses **everyday, conversational prompts** (the way people actually type — lowercase, run-on, polite, with justifications and abbreviations). Token counts are **measured by the skill's own estimator**, not estimated by hand — every row is reproducible (see [Reproduce these numbers](#-reproduce-these-numbers)).

| # | Severity | Before (raw prompt) | After (optimized) | Tokens | Savings |
|---|----------|---------------------|-------------------|--------|---------|
| 1 | Normal | *"salut, est-ce que tu pourrais m'aider à écrire une fonction python qui lit un csv et qui me sort la moyenne d'une colonne stp ? c'est un peu urgent pour le boulot merci beaucoup"* | "Écris une fonction Python qui lit un CSV et calcule la moyenne d'une colonne." | 42 → 17 | **-59.5%** |
| 2 | Normal | *"coucou, je me demandais si tu pouvais regarder mon code et me dire pourquoi ça plante, en gros j'ai une erreur null quelque part mais je trouve pas, ça m'aiderait vraiment merci d'avance"* | "Analyse ce code et identifie la cause de l'erreur null." | 46 → 14 | **-69.6%** |
| 3 | Aggressive | *"hey du coup j'aimerais bien que tu me fasses un petit script bash pour backup mes fichiers tous les jours si possible, enfin si c'est pas trop compliqué bien sûr, merci !"* | "Écris un script bash qui sauvegarde mes fichiers quotidiennement." | 42 → 16 | **-61.9%** |
| 4 | Aggressive | *"yo est-ce que tu peux me write une fonction qui parse le json et qui gère bien les erreurs stp, c'est important pour mon projet merci"* | "Write a function to parse JSON with error handling." | 32 → 12 | **-62.5%** |
| 5 | Normal | *"bonjour, j'ai vraiment besoin que tu m'expliques en détail comment marche les promesses en javascript parce que je suis un peu perdu et c'est pour mon cours, merci d'avance c'est gentil"* | "Explique le fonctionnement des promesses en JavaScript." | 45 → 16 | **-64.4%** |

**Total: 207 → 75 tokens — an average of `-63.8%` across 5 realistic prompts.**

> 💡 Savings compound over a session — at ~26 tokens saved per prompt, a user who sends 50 prompts/day saves **~1,300 tokens daily** with no loss of intent.

### 🔬 Reproduce these numbers

The figures above are produced by the same `estimateTokens` / `calculateCompression` logic the skill uses at runtime. To re-run them yourself:

```js
// bench.cjs
const { calculateCompression } = require('./scripts/auto_learn.cjs');
const r = calculateCompression(
  "salut, est-ce que tu pourrais m'aider à écrire une fonction python qui lit un csv et qui me sort la moyenne d'une colonne stp ? c'est un peu urgent pour le boulot merci beaucoup",
  "Écris une fonction Python qui lit un CSV et calcule la moyenne d'une colonne."
);
console.log(r); // { saved: 25, ratio: '59.5', originalTokens: 42, optimizedTokens: 17 }
```

```bash
node bench.cjs
```

---

## 🚀 One-Line Installation

Pick your platform and run the command in your terminal:

| Platform | Command |
|----------|---------|
| **Gemini CLI** | `curl -sSL https://raw.githubusercontent.com/RomainKH/prompt-optimizer/main/install.sh \| bash` |
| **Antigravity IDE** | `curl -sSL https://raw.githubusercontent.com/RomainKH/prompt-optimizer/main/install-antigravity.sh \| bash` |
| **Claude Code** | `curl -sSL https://raw.githubusercontent.com/RomainKH/prompt-optimizer/main/install-claude.sh \| bash` |
| **Cursor** | `curl -sSL https://raw.githubusercontent.com/RomainKH/prompt-optimizer/main/install-cursor.sh \| bash` |
| **GitHub Copilot** | `curl -sSL https://raw.githubusercontent.com/RomainKH/prompt-optimizer/main/install-copilot.sh \| bash` |
| **Windsurf (Codeium)** | `curl -sSL https://raw.githubusercontent.com/RomainKH/prompt-optimizer/main/install-windsurf.sh \| bash` |
| **ChatGPT** | `curl -sSL https://raw.githubusercontent.com/RomainKH/prompt-optimizer/main/install-chatgpt.sh \| bash` |

---

## 🤖 Manual Setup for Other LLMs

### DeepSeek / Mistral / Qwen / Llama (Self-hosted or Web)

- **System Prompt:** Most interfaces (Ollama, LM Studio, Poe) let you set a "System Prompt". Copy the **Core Principles** and **Workflow** sections from [`SKILL.md`](SKILL.md) and paste them there.

### Hermes / Open-Source Models

- Use the **Reverse Caveman** logic. These models are highly sensitive to direct instructions. Using the optimized output from this skill will significantly improve their reasoning performance.

---

## 🛠 Features

- **3 Severity Levels** — `light`, `normal`, `aggressive` — control how much gets stripped.
- **Dry-Run Mode** — Preview what would be removed before committing.
- **Whitelist** — Protect specific words from ever being removed.
- **Self-Learning** — Tracks your patterns and auto-promotes frequent fluff to the reference list.
- **Stats Decay** — Old patterns lose weight over time, keeping the system relevant.
- **Multilingual** — Pre-configured for EN, FR, ES, IT with 8 categories each.
- **Mixed-Language** — Handles prompts written in multiple languages at once.
- **Compression Stats** — Reports token savings for every optimization.

---

## Contributions Needed! 🌍

We want to make this tool truly global. If you can help add "fluff" patterns for other languages (**German, Japanese, Chinese, Arabic, etc.**), please open a Pull Request! Your contributions to `references/clean-patterns.md` are highly welcome.

## License

MIT

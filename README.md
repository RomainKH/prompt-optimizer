# Prompt Optimizer Skill (v1.1.0)

An intelligent skill that strips "prompt fluff" (politeness, fillers, unnecessary context) to reduce token consumption and improve LLM instruction clarity. Self-learning, multi-platform, multilingual.

## 📉 Performance — real prompts, measured before/after

The table below uses **everyday, conversational prompts** (the way people actually type — lowercase, run-on, polite, with justifications and abbreviations). Token counts are **measured by the skill's own estimator**, not estimated by hand — every row is reproducible (see [Reproduce these numbers](#-reproduce-these-numbers)).

| # | Severity | Before (raw prompt) | After (optimized) | Tokens | Savings |
|---|----------|---------------------|-------------------|--------|---------|
| 1 | Normal | *"tu peux regarder pourquoi mon build passe pas, j'ai un truc bizarre avec les imports du coup ça compile pas"* | "Identifie pourquoi le build échoue (erreur d'imports)." | 24 → 15 | **-37.5%** |
| 2 | Normal | *"du coup faut que je refacto cette fonction elle est beaucoup trop longue, tu peux m'aider à la découper un peu"* | "Refactore cette fonction trop longue en la découpant." | 26 → 14 | **-46.2%** |
| 3 | Normal | *"juste un truc vite fait, tu peux me faire une regex qui valide un email stp"* | "Écris une regex qui valide un email." | 17 → 8 | **-52.9%** |
| 4 | Aggressive | *"ok donc en gros j'aimerais bien que tu m'écrives un endpoint express qui récupère les users depuis la db"* | "Écris un endpoint Express qui récupère les users depuis la DB." | 26 → 14 | **-46.2%** |
| 5 | Normal | *"par contre faudrait que tu check ce code, je pense qu'il y a une fuite mémoire quelque part mais je suis pas sûr"* | "Analyse ce code pour détecter une fuite mémoire." | 26 → 10 | **-61.5%** |

**Total: 119 → 61 tokens — an average of `-48.7%` across 5 realistic prompts.**

> 💡 Savings compound over a session — at ~12 tokens saved per prompt, a developer who sends 50 prompts/day saves **~580 tokens daily** with no loss of intent.

### 🔬 Reproduce these numbers

The figures above are produced by the same `estimateTokens` / `calculateCompression` logic the skill uses at runtime. To re-run them yourself:

```js
// bench.cjs
const { calculateCompression } = require('./scripts/auto_learn.cjs');
const r = calculateCompression(
  "tu peux regarder pourquoi mon build passe pas, j'ai un truc bizarre avec les imports du coup ça compile pas",
  "Identifie pourquoi le build échoue (erreur d'imports)."
);
console.log(r); // { saved: 9, ratio: '37.5', originalTokens: 24, optimizedTokens: 15 }
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

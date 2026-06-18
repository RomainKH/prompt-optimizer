---
name: prompt-optimizer
description: Optimizes user prompts by removing fluff (politeness, fillers, unnecessary context) to reduce token usage and improve clarity. Supports self-learning and compression stats.
---

# Prompt Optimizer (V2)

This skill transforms verbose user queries into direct, high-signal instructions for an AI.

## Core Principles

1. **Intent Extraction:** Identify the core action (e.g., "code", "summarize", "analyze").
2. **Fluff Removal:** Strip away politeness markers, hesitant intros, and justifications that don't influence the technical outcome.
3. **Structure Preservation:** Keep proper syntax (subject + verb + object) to ensure the target AI understands nuances, unlike a pure "Caveman" mode.

## V2 Workflow

When asked to optimize a prompt:

1. **Analysis:** Identify the language and consult [clean-patterns.md](references/clean-patterns.md).
2. **Optimization:** Rewrite the request using imperative or infinitive verbs.
3. **Logging & Stats:**
   - Execute `scripts/auto_learn.cjs log "original phrase" "optimized phrase" "removed_word1" "removed_word2"`.
   - The script will output the **Compression Ratio (%)** and **Tokens Saved**.
4. **Output:** Provide the optimized prompt to the user along with the compression metrics.

## Example (Multilingual)

- **Input (FR):** "Salut ! Est-ce que tu pourrais m'écrire un petit mail pour mon boss pour lui dire que je serai en retard demain matin s'il te plaît ? Merci beaucoup !"
- **Output:** "Rédige un email professionnel informant mon manager de mon retard demain matin."
- **Stats:** -45% tokens.

- **Input (EN):** "I was wondering if you could help me analyze this dataset and find the average price, it's very important for my study."
- **Output:** "Analyze this dataset to calculate the average price."
- **Stats:** -38% tokens.

## Self-Learning
Consult `assets/learning_log.json` periodically to see which fluff patterns are most common and adjust optimization severity accordingly.

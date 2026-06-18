# Prompt Optimizer Skill (V2)

An intelligent tool designed to strip away "prompt fluff" (politeness, fillers, and unnecessary context) to reduce token consumption and improve LLM instruction clarity.

## 🚀 One-Link Installation (Gemini CLI)

Run this command in your terminal to download and install automatically:

```bash
curl -sSL https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/main/install.sh | bash
```
*Note: Don't forget to run `/skills reload` inside Gemini CLI after installation.*

---

## 🤖 Usage with Other LLMs (Claude, ChatGPT, Mistral, etc.)

This logic can be used with any AI model. Since other platforms don't have a "native skill" system like Gemini CLI, you can "install" it by setting up a **System Prompt**.

### 1. Claude (Anthropic)
- **Projects:** Create a new Project and upload `SKILL.md` and `references/clean-patterns.md` as "Project Knowledge".
- **Direct Chat:** Paste the content of `SKILL.md` at the beginning of your chat and say: *"Follow these instructions to optimize all my future prompts in this thread."*

### 2. ChatGPT (OpenAI)
- **Custom GPT:** Create a new GPT. In the **Instructions** field, paste the content of `SKILL.md`. Upload `clean-patterns.md` to the **Knowledge** section.
- **Custom Instructions:** Go to "Customize ChatGPT" and paste the `SKILL.md` content into the "How would you like ChatGPT to respond?" box.

### 3. DeepSeek / Mistral / Qwen / Llama (Self-hosted or Web)
- **System Prompt:** Most interfaces (like Ollama, LM Studio, or Poe) allow you to set a "System Prompt". Copy the **Core Principles** and **Workflow** sections from `SKILL.md` and paste them there.

### 4. Hermes / Open-Source Models
- Use the **Reverse Caveman** logic. These models are highly sensitive to direct instructions. Using the optimized output from this skill will significantly improve their reasoning performance.

---

## 🛠 Features
- **Reverse Caveman Mode:** Keeps grammatical structure while removing token-wasting segments.
- **V2 Compression Stats:** Calculates estimated token savings (-% ratio).
- **Multilingual:** Pre-configured for EN, FR, ES, IT.
- **Self-Learning:** Logs removed words to `assets/learning_log.json`.

## Contributions Needed! 🌍

We want to make this tool truly global. If you can help add "fluff" patterns for other languages (**German, Japanese, Chinese, Arabic, etc.**), please open a Pull Request! Your contributions to `references/clean-patterns.md` are highly welcome.

## License
MIT

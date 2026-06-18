#!/bin/bash

# Prompt Optimizer - One-Link Installer for Gemini CLI
# Usage: curl -sSL https://raw.githubusercontent.com/RomainKH/prompt-optimizer/main/install.sh | bash

SKILL_NAME="prompt-optimizer"
SKILL_FILE="prompt-optimizer.skill"
REPO_URL="https://github.com/RomainKH/prompt-optimizer/releases/latest/download/$SKILL_FILE"

echo "📥 Downloading $SKILL_NAME..."
curl -L -o "$SKILL_FILE" "$REPO_URL"

if [ $? -eq 0 ]; then
    echo "⚙️  Installing skill..."
    gemini skills install "$SKILL_FILE" --scope user
    echo "✅ Installation complete!"
    echo "⚠️  IMPORTANT: Please run '/skills reload' in your Gemini CLI session to activate the skill."
    rm "$SKILL_FILE"
else
    echo "❌ Download failed. Please check your internet connection or the repository URL."
    exit 1
fi

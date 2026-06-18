#!/bin/bash

# Prompt Optimizer - One-Line Installer for GitHub Copilot
# Usage: curl -sSL https://raw.githubusercontent.com/RomainKH/prompt-optimizer/main/install-copilot.sh | bash

set -e

REPO="RomainKH/prompt-optimizer"
RAW_BASE="https://raw.githubusercontent.com/$REPO/main"
COPILOT_DIR="$HOME/.github"
INSTRUCTIONS_FILE="$COPILOT_DIR/copilot-instructions.md"

echo "📥 Installing Prompt Optimizer for GitHub Copilot..."

mkdir -p "$COPILOT_DIR"

# Download SKILL.md content and append to copilot instructions
SKILL_CONTENT=$(curl -sSL "$RAW_BASE/SKILL.md")
PATTERNS_CONTENT=$(curl -sSL "$RAW_BASE/references/clean-patterns.md")

MARKER="<!-- prompt-optimizer-start -->"
END_MARKER="<!-- prompt-optimizer-end -->"

# Check if already installed
if [ -f "$INSTRUCTIONS_FILE" ] && grep -q "$MARKER" "$INSTRUCTIONS_FILE" 2>/dev/null; then
    echo "   ↳ Prompt Optimizer already present in copilot-instructions.md, updating..."
    # Remove old content between markers
    sed -i.bak "/$MARKER/,/$END_MARKER/d" "$INSTRUCTIONS_FILE"
    rm -f "${INSTRUCTIONS_FILE}.bak"
fi

# Append skill content
{
    echo ""
    echo "$MARKER"
    echo ""
    echo "$SKILL_CONTENT"
    echo ""
    echo "---"
    echo ""
    echo "$PATTERNS_CONTENT"
    echo ""
    echo "$END_MARKER"
} >> "$INSTRUCTIONS_FILE"

echo "   ↳ Updated: $INSTRUCTIONS_FILE"

echo ""
echo "✅ Prompt Optimizer installed for GitHub Copilot!"
echo "   Location: $INSTRUCTIONS_FILE"
echo ""
echo "💡 Usage: Ask Copilot to \"optimize this prompt: ...\" in any repo."
echo "   Note: For per-project use, copy the content to .github/copilot-instructions.md in your repo."

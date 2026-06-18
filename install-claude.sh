#!/bin/bash

# Prompt Optimizer - One-Line Installer for Claude Code
# Usage: curl -sSL https://raw.githubusercontent.com/RomainKH/prompt-optimizer/main/install-claude.sh | bash

set -e

REPO="RomainKH/prompt-optimizer"
RAW_BASE="https://raw.githubusercontent.com/$REPO/main"
CLAUDE_DIR="$HOME/.claude"
SKILL_DIR="$CLAUDE_DIR/skills/prompt-optimizer"

echo "📥 Installing Prompt Optimizer for Claude Code..."

# Create the skill directory
mkdir -p "$SKILL_DIR/references"
mkdir -p "$SKILL_DIR/scripts"
mkdir -p "$SKILL_DIR/assets"

# Download core files
echo "   ↳ Downloading SKILL.md..."
curl -sSL "$RAW_BASE/SKILL.md" -o "$SKILL_DIR/SKILL.md"

echo "   ↳ Downloading clean-patterns.md..."
curl -sSL "$RAW_BASE/references/clean-patterns.md" -o "$SKILL_DIR/references/clean-patterns.md"

echo "   ↳ Downloading auto_learn.cjs..."
curl -sSL "$RAW_BASE/scripts/auto_learn.cjs" -o "$SKILL_DIR/scripts/auto_learn.cjs"

# Initialize empty learning log if it doesn't exist
if [ ! -f "$SKILL_DIR/assets/learning_log.json" ]; then
    echo '{"stats":{},"candidates":{},"promoted":[],"history":[],"totalTokensSaved":0}' > "$SKILL_DIR/assets/learning_log.json"
fi

# Add to CLAUDE.md if it exists, or create it
CLAUDE_MD="$CLAUDE_DIR/CLAUDE.md"
SKILL_INSTRUCTION="Use the prompt-optimizer skill in ~/.claude/skills/prompt-optimizer/SKILL.md to optimize user prompts when asked."

if [ -f "$CLAUDE_MD" ]; then
    if ! grep -q "prompt-optimizer" "$CLAUDE_MD" 2>/dev/null; then
        echo "" >> "$CLAUDE_MD"
        echo "## Prompt Optimizer" >> "$CLAUDE_MD"
        echo "$SKILL_INSTRUCTION" >> "$CLAUDE_MD"
        echo "   ↳ Updated ~/.claude/CLAUDE.md"
    else
        echo "   ↳ ~/.claude/CLAUDE.md already references prompt-optimizer, skipping."
    fi
else
    echo "## Prompt Optimizer" > "$CLAUDE_MD"
    echo "$SKILL_INSTRUCTION" >> "$CLAUDE_MD"
    echo "   ↳ Created ~/.claude/CLAUDE.md"
fi

echo ""
echo "✅ Prompt Optimizer installed for Claude Code!"
echo "   Location: $SKILL_DIR"
echo ""
echo "💡 Usage: Ask Claude to \"optimize this prompt: ...\" and it will use the skill automatically."

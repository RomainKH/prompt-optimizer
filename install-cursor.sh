#!/bin/bash

# Prompt Optimizer - One-Line Installer for Cursor IDE
# Usage: curl -sSL https://raw.githubusercontent.com/RomainKH/prompt-optimizer/main/install-cursor.sh | bash

set -e

REPO="RomainKH/prompt-optimizer"
RAW_BASE="https://raw.githubusercontent.com/$REPO/main"
CURSOR_DIR="$HOME/.cursor"
RULES_DIR="$CURSOR_DIR/rules"
SKILL_DIR="$CURSOR_DIR/skills/prompt-optimizer"

echo "📥 Installing Prompt Optimizer for Cursor..."

# Create directories
mkdir -p "$RULES_DIR"
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

# Initialize empty learning log
if [ ! -f "$SKILL_DIR/assets/learning_log.json" ]; then
    echo '{"stats":{},"candidates":{},"promoted":[],"history":[],"totalTokensSaved":0}' > "$SKILL_DIR/assets/learning_log.json"
fi

# Create a Cursor rule file that references the skill
RULE_FILE="$RULES_DIR/prompt-optimizer.mdc"
if [ ! -f "$RULE_FILE" ]; then
    cat > "$RULE_FILE" << EOF
---
description: Prompt Optimizer - Reduces token usage by removing fluff from prompts
globs:
alwaysApply: true
---

# Prompt Optimizer

When the user asks to optimize a prompt, follow the instructions in ~/.cursor/skills/prompt-optimizer/SKILL.md

Reference patterns are in ~/.cursor/skills/prompt-optimizer/references/clean-patterns.md

Log optimizations using: node ~/.cursor/skills/prompt-optimizer/scripts/auto_learn.cjs
EOF
    echo "   ↳ Created Cursor rule: $RULE_FILE"
else
    echo "   ↳ Cursor rule already exists, skipping."
fi

echo ""
echo "✅ Prompt Optimizer installed for Cursor!"
echo "   Skill location: $SKILL_DIR"
echo "   Rule location: $RULE_FILE"
echo ""
echo "💡 Usage: Ask Cursor to \"optimize this prompt: ...\" and it will use the skill automatically."

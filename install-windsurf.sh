#!/bin/bash

# Prompt Optimizer - One-Line Installer for Windsurf (Codeium)
# Usage: curl -sSL https://raw.githubusercontent.com/RomainKH/prompt-optimizer/main/install-windsurf.sh | bash

set -e

REPO="RomainKH/prompt-optimizer"
RAW_BASE="https://raw.githubusercontent.com/$REPO/main"
WINDSURF_DIR="$HOME/.codeium/windsurf"
SKILL_DIR="$WINDSURF_DIR/skills/prompt-optimizer"
RULES_DIR="$WINDSURF_DIR/rules"

echo "📥 Installing Prompt Optimizer for Windsurf..."

# Create directories
mkdir -p "$SKILL_DIR/references"
mkdir -p "$SKILL_DIR/scripts"
mkdir -p "$SKILL_DIR/assets"
mkdir -p "$RULES_DIR"

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

# Create a global rule file
RULE_FILE="$RULES_DIR/prompt-optimizer.md"
if [ ! -f "$RULE_FILE" ]; then
    cat > "$RULE_FILE" << EOF
# Prompt Optimizer

When the user asks to optimize a prompt, follow the instructions in ~/.codeium/windsurf/skills/prompt-optimizer/SKILL.md

Reference patterns: ~/.codeium/windsurf/skills/prompt-optimizer/references/clean-patterns.md
Auto-learn script: node ~/.codeium/windsurf/skills/prompt-optimizer/scripts/auto_learn.cjs
EOF
    echo "   ↳ Created Windsurf rule: $RULE_FILE"
else
    echo "   ↳ Windsurf rule already exists, skipping."
fi

echo ""
echo "✅ Prompt Optimizer installed for Windsurf!"
echo "   Location: $SKILL_DIR"
echo ""
echo "💡 Usage: Ask Windsurf to \"optimize this prompt: ...\" and it will use the skill automatically."

#!/bin/bash

# Prompt Optimizer - One-Line Installer for Antigravity IDE
# Usage: curl -sSL https://raw.githubusercontent.com/RomainKH/prompt-optimizer/main/install-antigravity.sh | bash

set -e

REPO="RomainKH/prompt-optimizer"
RAW_BASE="https://raw.githubusercontent.com/$REPO/main"
PLUGIN_DIR="$HOME/.gemini/config/plugins/prompt-optimizer"
SKILL_DIR="$PLUGIN_DIR/skills/prompt-optimizer"

echo "📥 Installing Prompt Optimizer for Antigravity IDE..."

# Create plugin structure
mkdir -p "$SKILL_DIR/references"
mkdir -p "$SKILL_DIR/scripts"
mkdir -p "$SKILL_DIR/assets"

# Download plugin.json
echo "   ↳ Creating plugin.json..."
cat > "$PLUGIN_DIR/plugin.json" << 'EOF'
{
  "name": "prompt-optimizer",
  "description": "Optimizes user prompts by removing fluff to reduce token usage and improve clarity. Features self-learning with auto-promotion.",
  "version": "1.1.0"
}
EOF

# Download skill files
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

echo ""
echo "✅ Prompt Optimizer installed for Antigravity IDE!"
echo "   Location: $PLUGIN_DIR"
echo ""
echo "💡 The plugin will be available in your next Antigravity session."
echo "   Usage: Ask to \"optimize this prompt: ...\" and it will use the skill automatically."

#!/bin/bash

# Prompt Optimizer - Setup Helper for ChatGPT Custom GPT
# Usage: curl -sSL https://raw.githubusercontent.com/RomainKH/prompt-optimizer/main/install-chatgpt.sh | bash
#
# This script downloads the files you need and prints instructions
# for creating a Custom GPT on ChatGPT.

set -e

REPO="RomainKH/prompt-optimizer"
RAW_BASE="https://raw.githubusercontent.com/$REPO/main"
DEST_DIR="$HOME/prompt-optimizer-chatgpt"

echo "📥 Downloading Prompt Optimizer files for ChatGPT setup..."

mkdir -p "$DEST_DIR"

curl -sSL "$RAW_BASE/SKILL.md" -o "$DEST_DIR/SKILL.md"
curl -sSL "$RAW_BASE/references/clean-patterns.md" -o "$DEST_DIR/clean-patterns.md"

echo ""
echo "✅ Files downloaded to: $DEST_DIR"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋 How to create your Custom GPT on ChatGPT:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1. Go to https://chatgpt.com/gpts/editor"
echo "  2. Click 'Create a GPT'"
echo "  3. Go to the 'Configure' tab"
echo "  4. Name: 'Prompt Optimizer'"
echo "  5. Instructions: paste the content of $DEST_DIR/SKILL.md"
echo "  6. Knowledge: upload $DEST_DIR/clean-patterns.md"
echo "  7. Save → 'Only me' or 'Anyone with a link'"
echo ""
echo "  💡 Alternative (no Custom GPT needed):"
echo "  Go to Settings → Personalization → Custom Instructions"
echo "  and paste the SKILL.md content."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

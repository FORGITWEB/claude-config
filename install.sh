#!/bin/bash
# ============================================
# FORGITWEB — Claude Code Config Installer
# ============================================
# Installe la configuration Claude Code de l'agence FORGITWEB :
# - CLAUDE.md (règles globales)
# - 23 skills (nouveau-projet, audit-complet, seo-toolkit, etc.)
# - 3 templates (mentions légales, design patterns, checklist Next.js)
# - 8 agents (DA, SEO, Rédacteur, Dev, Performance, Accessibilité, etc.)

set -e

CLAUDE_DIR="$HOME/.claude"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║  FORGITWEB — Claude Code Installer   ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# ---- Vérifier que Claude Code est installé ----
if [ ! -d "$CLAUDE_DIR" ]; then
    echo "[!] Le dossier ~/.claude n'existe pas."
    echo "    Installe d'abord Claude Code : npm install -g @anthropic-ai/claude-code"
    exit 1
fi

# ---- Backup si CLAUDE.md existe déjà ----
if [ -f "$CLAUDE_DIR/CLAUDE.md" ]; then
    BACKUP="$CLAUDE_DIR/CLAUDE.md.backup.$(date +%Y%m%d-%H%M%S)"
    cp "$CLAUDE_DIR/CLAUDE.md" "$BACKUP"
    echo "[i] CLAUDE.md existant sauvegardé → $BACKUP"
fi

# ---- Copier CLAUDE.md ----
cp "$SCRIPT_DIR/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
echo "[+] CLAUDE.md installé"

# ---- Copier skills ----
rsync -a --exclude='__pycache__' "$SCRIPT_DIR/skills/" "$CLAUDE_DIR/skills/"
SKILL_COUNT=$(find "$SCRIPT_DIR/skills" -name "SKILL.md" | wc -l | tr -d ' ')
echo "[+] $SKILL_COUNT skills installées"

# ---- Copier templates ----
mkdir -p "$CLAUDE_DIR/templates"
rsync -a "$SCRIPT_DIR/templates/" "$CLAUDE_DIR/templates/"
TEMPLATE_COUNT=$(find "$SCRIPT_DIR/templates" -type f | wc -l | tr -d ' ')
echo "[+] $TEMPLATE_COUNT templates installés"

# ---- Copier agents ----
mkdir -p "$CLAUDE_DIR/agents"
rsync -a "$SCRIPT_DIR/agents/" "$CLAUDE_DIR/agents/"
AGENT_COUNT=$(find "$SCRIPT_DIR/agents" -type f -name "*.md" | wc -l | tr -d ' ')
echo "[+] $AGENT_COUNT agents installés"

# ---- Vérifier Python (requis par ui-ux-pro-max) ----
if command -v python3 &> /dev/null; then
    echo "[+] Python3 détecté : $(python3 --version 2>&1)"
else
    echo "[!] Python3 non détecté — requis par ui-ux-pro-max"
    echo "    Installe avec : brew install python3"
fi

# ---- Vérifier trash (requis par CLAUDE.md) ----
if command -v trash &> /dev/null; then
    echo "[+] trash détecté"
else
    echo "[!] trash non installé — requis par les règles FORGITWEB"
    echo "    Installe avec : brew install trash"
fi

# ---- Installer MEMORY.md ----
MEMORY_DIR="$CLAUDE_DIR/projects/-Users-$(whoami)/memory"
mkdir -p "$MEMORY_DIR"
if [ ! -f "$MEMORY_DIR/MEMORY.md" ]; then
    cp "$SCRIPT_DIR/MEMORY.md" "$MEMORY_DIR/MEMORY.md"
    echo "[+] MEMORY.md installé"
else
    echo "[i] MEMORY.md existe déjà — pas écrasé (merge manuel si besoin)"
    echo "    Nouveau MEMORY.md disponible dans : $SCRIPT_DIR/MEMORY.md"
fi

echo ""
echo "  Installation terminée !"
echo ""
echo "  Prochaines étapes :"
echo "  1. Lance 'claude' dans un terminal"
echo "  2. Vérifie avec : /skills"
echo "  3. Teste avec : /nouveau-projet"
echo ""

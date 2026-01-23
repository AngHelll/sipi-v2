#!/bin/bash
# Script para push dual: Gitea + GitHub
# Uso: ./git-push-all.sh [branch]
# Default: main

BRANCH=${1:-main}

echo "🚀 Iniciando push dual a Gitea y GitHub..."
echo ""

# Push a Gitea (CI/CD)
echo "📤 Pushing to Gitea (CI/CD)..."
if git push gitea $BRANCH; then
    echo "✅ Pushed to Gitea successfully"
else
    echo "❌ Failed to push to Gitea"
    exit 1
fi

echo ""

# Push a GitHub (Backup/Colaboración)
echo "📤 Pushing to GitHub (Backup)..."
if git push origin $BRANCH; then
    echo "✅ Pushed to GitHub successfully"
else
    echo "❌ Failed to push to GitHub"
    exit 1
fi

echo ""
echo "✅ All remotes synchronized!"
echo "   - Gitea: CI/CD triggered"
echo "   - GitHub: Backup updated"

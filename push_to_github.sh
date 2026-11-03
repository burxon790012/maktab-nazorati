#!/usr/bin/env bash
set -e

echo "===================================================================="
echo "  🛡️ SMART CHILD — GitHub-ga Avtomatik Yuklash Tizimi"
echo "===================================================================="

USERNAME="burxon790012"
REPO="maktab-nazorati"

echo "[1/2] O'zgarishlar saqlanmoqda..."
git add .
git commit -m "Update SMART CHILD platform" || true

echo "[2/2] GitHub serveriga yuklanmoqda (Push)..."
git push origin main

echo ""
echo "===================================================================="
echo "  ✅ Muvaffaqiyatli GitHub-ga yuklandi!"
echo "===================================================================="

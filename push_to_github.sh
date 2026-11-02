#!/usr/bin/env bash
set -e

echo "===================================================================="
echo "  🛡️ SMART CHILD — GitHub-ga Avtomatik Yuklash Tizimi"
echo "===================================================================="

USERNAME="burxon790012"
REPO="maktab-nazorati"
TOKEN="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"

# 1. Nusxalash
echo "[1/3] Yangilangan fayllar nusxalanmoqda..."
cp -r /home/kali/Games/an/drive_c/users/steamuser/.gemini/antigravity-ide/scratch/maktab-nazorati/* ~/maktab-nazorati/

# 2. Git amallari
cd ~/maktab-nazorati
echo "[2/3] Git o'zgarishlar saqlanmoqda..."
git add .
git commit -m "Fix: Xaritadagi API KEY REQUIRED bartaraf etildi (OpenStreetMap fallback integratsiya qilindi)" || true

# 3. Push
echo "[3/3] GitHub serveriga yuklanmoqda (Push)..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://${USERNAME}:${TOKEN}@github.com/${USERNAME}/${REPO}.git"
git push -u origin main

echo ""
echo "===================================================================="
echo "  ✅ Barcha kodlar muvaffaqiyatli GitHub-ga yuklandi!"
echo "  🔗 Havola: https://github.com/${USERNAME}/${REPO}"
echo "===================================================================="

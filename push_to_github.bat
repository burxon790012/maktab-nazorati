@echo off
chcp 65001 >nul
echo ====================================================================
echo   🛡️ SMART CHILD — GitHub-ga Avtomatik Yuklash Tizimi
echo ====================================================================
echo.

set USERNAME=burxon790012
set REPO=maktab-nazorati

if "%TOKEN%"=="" (
  set /p TOKEN="GitHub Personal Access Token (ghp_...): "
)

echo [1/3] Git konfiguratsiya va fayllar tayyorlanmoqda...
git add .
git commit -m "Update SMART CHILD platform"

echo [2/3] GitHub serveriga yuklanmoqda (Push)...
git remote set-url origin https://%USERNAME%:%TOKEN%@github.com/%USERNAME%/%REPO%.git
git push origin main

echo.
echo ====================================================================
echo   ✅ Muvaffaqiyatli GitHub-ga yuklandi!
echo ====================================================================
echo.
pause

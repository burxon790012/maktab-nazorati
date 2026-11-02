@echo off
chcp 65001 >nul
echo ====================================================================
echo   🛡️ SMART CHILD — GitHub-ga Avtomatik Yuklash Tizimi
echo ====================================================================
echo.

set USERNAME=burxon790012
set REPO=maktab-nazorati
set TOKEN=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

echo [1/4] GitHub-da repozitoriy tekshirilmoqda va yaratilmoqda...
curl -s -H "Authorization: token %TOKEN%" -H "User-Agent: AutoPush" -X POST https://api.github.com/user/repos -d "{\"name\":\"%REPO%\",\"description\":\"SMART CHILD: Multi-School Child Safety, GPS Tracking, Health Monitoring & Smart Attendance Platform\",\"private\":false}" >nul 2>&1

echo [2/4] Git konfiguratsiya va fayllar tayyorlanmoqda...
git init
git config user.name "%USERNAME%"
git config user.email "%USERNAME%@users.noreply.github.com"
git checkout -B main
git add .
git commit -m "SMART CHILD: Multi-School Child Safety, GPS Tracking, Health Monitoring & Smart Attendance Platform"

echo [3/4] GitHub serveriga yuklanmoqda (Push)...
git remote remove origin >nul 2>&1
git remote add origin https://%USERNAME%:%TOKEN%@github.com/%USERNAME%/%REPO%.git
git push -u origin main --force

echo.
echo ====================================================================
echo   ✅ Barcha SMART CHILD kodlari muvaffaqiyatli GitHub-ga yuklandi!
echo   🔗 Havola: https://github.com/%USERNAME%/%REPO%
echo ====================================================================
echo.
pause

@echo off
title MEB School API Server
cd /d "%~dp0"

echo Node.js versiyonu kontrol ediliyor...
node -v
if errorlevel 1 (
    echo HATA: Node.js yuklu degil! Lutfen https://nodejs.org adresinden indirin.
    pause
    exit /b 1
)

echo.
echo Gerekli moduller kontrol ediliyor...
if not exist "node_modules" (
    echo Moduller yukleniyor...
    call npm install
    if errorlevel 1 (
        echo HATA: Moduller yuklenemedi!
        pause
        exit /b 1
    )
)

echo.
echo Server baslatiliyor...
node server/start.js
pause

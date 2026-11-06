@echo off
chcp 65001 > nul
title HEPCO COMMAND
cd /d "%~dp0frontend"

if not exist "dist\index.html" (
    call npx vite build
)

start "" "node_modules\electron\dist\electron.exe" .
exit

@echo off
chcp 65001 >nul
title ĐẨY SOURCE HEPCO COMMAND LÊN GITHUB
echo =========================================================================
echo   HE THONG CHI HUY CNTT HEPCO COMMAND - DAY MA NGUON LEN GITHUB
echo   Repository: git@github.com:lequan2512/ITCommand_HEPCO.git
echo =========================================================================
echo.
cd /d "%~dp0"

echo [1/3] Kiem tra trang thai Git...
git status -s

echo.
echo [2/3] Dang day toan bo source len nhanh main...
echo (Neu co yeu cau nhap Passphrase cua SSH key hoac dang nhap, ban hay nhap nhe)
echo.

git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================================================
    echo [THANH CONG] Toan bo source code da duoc day len GitHub thanh cong!
    echo Dia chi repo: https://github.com/lequan2512/ITCommand_HEPCO
    echo =========================================================================
) else (
    echo.
    echo =========================================================================
    echo [CHU Y]: Neu bao loi "Repository not found" hoac "Permission denied":
    echo 1. Hay chac chan ban da tao Repository "ITCommand_HEPCO" tren GitHub:
    echo    https://github.com/new
    echo 2. Neu muon chuyen sang dung HTTPS thay vi SSH, chay lenh:
    echo    git remote set-url origin https://github.com/lequan2512/ITCommand_HEPCO.git
    echo    git push -u origin main
    echo =========================================================================
)

echo.
pause

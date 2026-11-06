@echo off
chcp 65001 > nul
title HICC V1.0 - QUÉT MẠNG LAN NỘI BỘ
color 0B

echo ===============================================================================
echo                  HICC V1.0 - CÔNG CỤ QUÉT MẠNG LAN NỘI BỘ (CLI)
echo ===============================================================================
echo.
set /p SUBNET="Nhập dải mạng nội bộ cần quét (VD: 192.168.10.0/24): "

if "%SUBNET%"=="" (
    echo [LỖI] Dải mạng không được để trống!
    pause
    exit /b
)

echo.
echo [1] Quét thử nghiệm màn hình (Dry-run, không ghi Database)
echo [2] Quét chính thức & Đối soát ghi nhận vào Cơ sở Dữ liệu
set /p MODE="Chọn chế độ [1 hoặc 2]: "

cd /d "%~dp0"
set PYTHONPATH=backend;scanner

if "%MODE%"=="1" (
    python -m hicc_scanner.cli scan --subnet %SUBNET% --dry-run
) else (
    python -m hicc_scanner.cli scan --subnet %SUBNET% --type FULL_DISCOVERY
)

echo.
pause

@echo off
chcp 65001 > nul
title HEPCO IT COMMAND CENTER (HICC V1.0) - TRUNG TÂM QUẢN TRỊ MẠNG & THIẾT BỊ
color 0B

echo ===============================================================================
echo      HEPCO IT COMMAND CENTER (HICC V1.0) - TRUNG TÂM ĐIỀU HÀNH CNTT
echo                 ỨNG DỤNG QUẢN TRỊ MẠNG & THIẾT BỊ DOANH NGHIỆP
echo ===============================================================================
echo.
echo   [1] Khởi chạy Ứng dụng Desktop PC (Chuẩn MonMonPDF - Cửa sổ Native)
echo   [2] Khởi chạy giao diện Web Browser (Chrome / Edge)
echo   [3] Đóng gói ứng dụng thành file Windows Setup (.exe)
echo.
echo ===============================================================================
set /p CHOICE="Nhập lựa chọn của bạn [Mặc định: 1]: "

if "%CHOICE%"=="" set CHOICE=1

cd /d "%~dp0frontend"

if "%CHOICE%"=="1" (
    echo.
    echo [INFO] Đang mở Ứng dụng Desktop HICC Command Center...
    if not exist "dist\index.html" (
        echo [INFO] Đang tối ưu hóa giao diện lần đầu...
        call npx vite build
    )
    start "" "node_modules\electron\dist\electron.exe" .
    exit
)

if "%CHOICE%"=="2" (
    echo.
    echo [INFO] Đang khởi động máy chủ Web cục bộ...
    start "" http://localhost:5173
    call npx vite --host
    pause
    exit
)

if "%CHOICE%"=="3" (
    echo.
    echo [INFO] Đang đóng gói ứng dụng HICC thành file cài đặt Windows (.exe)...
    call npm run build
    call npx electron-builder --win --x64
    echo.
    echo [HOÀN TẤT] File .exe đã được xuất ra thư mục frontend\dist hoặc release!
    pause
    exit
)

echo [LỖI] Lựa chọn không hợp lệ!
pause

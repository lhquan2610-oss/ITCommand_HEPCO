@echo off
cd /d "%~dp0dist-app"
if exist "HEPCO_COMMAND_PORTABLE.exe" (
    start "" "HEPCO_COMMAND_PORTABLE.exe"
    exit /b 0
)
if exist "win-unpacked\HEPCO COMMAND.exe" (
    start "" "win-unpacked\HEPCO COMMAND.exe"
    exit /b 0
)
if exist "HEPCO_IT_COMMAND_CENTER_PORTABLE.exe" (
    start "" "HEPCO_IT_COMMAND_CENTER_PORTABLE.exe"
    exit /b 0
)
if exist "win-unpacked\HEPCO IT Command Center.exe" (
    start "" "win-unpacked\HEPCO IT Command Center.exe"
    exit /b 0
)
echo Khong tim thay tep thuc thi trong dist-app.
pause

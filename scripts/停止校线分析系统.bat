@echo off
chcp 65001 >nul
title Stop Rail Analysis System

echo ========================================
echo   Stopping Rail Quality Analysis System
echo ========================================

set SCRIPT_DIR=%~dp0

REM 自动向上查找项目根目录
set PROJECT_ROOT=%SCRIPT_DIR%
:find_root
if exist "%PROJECT_ROOT%\backend" if exist "%PROJECT_ROOT%\frontend" goto found_root
set PROJECT_ROOT=%PROJECT_ROOT%\..
if /i "%PROJECT_ROOT%" == "%~d0\" (
    echo [ERROR] Cannot find project root
    pause
    exit /b 1
)
goto find_root
:found_root

echo [1/2] Stopping backend service (port 8001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo Stopped PID %%a
)

echo [2/2] Stopping frontend service (port 3001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo Stopped PID %%a
)

echo.
echo All services stopped.

timeout /t 2 /nobreak >nul

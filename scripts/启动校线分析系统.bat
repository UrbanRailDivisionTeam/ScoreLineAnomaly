@echo off
chcp 65001 >nul
title Rail Quality Analysis System

echo ========================================
echo   Starting Rail Quality Analysis System
echo ========================================

set SCRIPT_DIR=%~dp0

REM 自动向上查找项目根目录（找到包含 backend 和 frontend 的目录）
set PROJECT_ROOT=%SCRIPT_DIR%
:find_root
if exist "%PROJECT_ROOT%\backend" if exist "%PROJECT_ROOT%\frontend" goto found_root
set PROJECT_ROOT=%PROJECT_ROOT%\..
if /i "%PROJECT_ROOT%" == "%~d0\" (
    echo [ERROR] Cannot find project root (backend and frontend folders)
    pause
    exit /b 1
)
goto find_root
:found_root

set BACKEND_DIR=%PROJECT_ROOT%\backend
set FRONTEND_DIR=%PROJECT_ROOT%\frontend

REM 检查并创建虚拟环境
if not exist "%BACKEND_DIR%\.venv" (
    echo [INFO] Creating Python virtual environment...
    cd /d "%BACKEND_DIR%"
    python -m venv .venv
    echo [INFO] Installing dependencies...
    .venv\Scripts\pip install -r requirements.txt
)

echo [1/3] Starting backend service (port 8001)...
start "Backend" /D "%BACKEND_DIR%" .venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8001

echo Waiting for backend (8 seconds)...
ping -n 8 127.0.0.1 >nul

netstat -ano | findstr ":8001" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo Backend may have failed - check window.
) else (
    echo Backend started!
)

echo [2/3] Starting frontend service (port 3001)...
start "Frontend" /D "%FRONTEND_DIR%" npm run dev -- --port 3001

echo Waiting for frontend (8 seconds)...
ping -n 8 127.0.0.1 >nul

netstat -ano | findstr ":3001" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo Frontend may have failed - check window.
) else (
    echo Frontend started!
    start http://localhost:3001
)

echo.
echo ========================================
echo   Done!
echo   Frontend: http://localhost:3001
echo   Backend:  http://localhost:8001/docs
echo ========================================
echo.
pause

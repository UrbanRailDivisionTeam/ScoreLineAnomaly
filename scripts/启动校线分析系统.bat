@echo off
chcp 65001 >nul
title Rail Quality Analysis System

echo ========================================
echo   Starting Rail Quality Analysis System
echo ========================================

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%\.."
set BACKEND_DIR=%CD%\backend
set FRONTEND_DIR=%CD%\frontend

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

@echo off
chcp 65001 >nul
title Stop Rail Analysis System

echo ========================================
echo   Stopping Rail Quality Analysis System
echo ========================================

echo [1/2] Stopping backend service...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/2] Stopping frontend service...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All services stopped.

timeout /t 2 /nobreak >nul

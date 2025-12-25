@echo off
REM Canadian Legal Assistant - Startup Script (Batch Version)
REM Starts both backend and frontend dev servers

setlocal enabledelayedexpansion

echo.
echo [STARTUP] Canadian Legal Assistant - Startup
echo ==================================================

REM Check if PowerShell script exists
if exist "%~dp0startup.ps1" (
    echo Starting servers using PowerShell...
    powershell -ExecutionPolicy Bypass -File "%~dp0startup.ps1" %*
    exit /b !ERRORLEVEL!
) else (
    echo [ERROR] startup.ps1 not found
    exit /b 1
)

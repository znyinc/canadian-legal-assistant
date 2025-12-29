@echo off
REM Canadian Legal Assistant - Startup Script (Batch Version)
REM Starts both backend and frontend dev servers

setlocal enabledelayedexpansion

pushd "%~dp0" >nul

echo.
echo [STARTUP] Canadian Legal Assistant - Startup
echo ==================================================

REM Check if PowerShell script exists
if exist "%~dp0startup.ps1" (
    echo Starting servers using PowerShell...
    powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0startup.ps1" %*
    set "exitCode=!ERRORLEVEL!"
    popd >nul
    exit /b !exitCode!
) else (
    echo [ERROR] startup.ps1 not found
    popd >nul
    exit /b 1
)

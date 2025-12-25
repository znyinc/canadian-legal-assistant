@echo off
REM Canadian Legal Assistant - Shutdown Script (Batch Version)
REM Stops both backend and frontend dev servers

setlocal enabledelayedexpansion

echo.
echo [SHUTDOWN] Canadian Legal Assistant - Shutdown
echo ==================================================

REM Check if PowerShell script exists
if exist "%~dp0shutdown.ps1" (
    echo Stopping servers using PowerShell...
    powershell -ExecutionPolicy Bypass -File "%~dp0shutdown.ps1" %*
    exit /b !ERRORLEVEL!
) else (
    echo [ERROR] shutdown.ps1 not found
    exit /b 1
)

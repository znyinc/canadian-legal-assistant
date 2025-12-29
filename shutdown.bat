@echo off
REM Canadian Legal Assistant - Shutdown Script (Batch Version)
REM Stops both backend and frontend dev servers

setlocal enabledelayedexpansion

pushd "%~dp0" >nul

echo.
echo [SHUTDOWN] Canadian Legal Assistant - Shutdown
echo ==================================================

REM Check if PowerShell script exists
if exist "%~dp0shutdown.ps1" (
    echo Stopping servers using PowerShell...
    powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0shutdown.ps1" %*
    set "exitCode=!ERRORLEVEL!"
    popd >nul
    exit /b !exitCode!
) else (
    echo [ERROR] shutdown.ps1 not found
    popd >nul
    exit /b 1
)

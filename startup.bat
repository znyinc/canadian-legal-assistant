@echo off
setlocal

set SCRIPT_DIR=%~dp0
set PS_CMD=pwsh
where %PS_CMD% >nul 2>nul
if errorlevel 1 set PS_CMD=powershell

%PS_CMD% -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%startup.ps1" -Clean -ShowConsole %*
set EXIT_CODE=%ERRORLEVEL%

endlocal
exit /b %EXIT_CODE%

# Canadian Legal Assistant - Startup Script
# Starts backend (port 3001) and frontend (port 5173/5174) dev servers
# Automatically kills any existing processes on those ports

param(
    [switch]$Clean = $false  # If -Clean flag is used, kill existing processes and restart
)

$ErrorActionPreference = "SilentlyContinue"
$BackendPort = 3001
$FrontendPort = 5174
# Prefer script directory; fall back to current working directory
$RootDir = if ($PSScriptRoot) { $PSScriptRoot } elseif ($MyInvocation.MyCommandPath) { Split-Path -Parent $MyInvocation.MyCommandPath } else { Get-Location }

Write-Host ""
Write-Host "[STARTUP] Canadian Legal Assistant - Startup Script" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Function to find and kill process on a port
function Stop-ProcessOnPort {
    param([int]$Port, [string]$ServiceName)
    
    $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
               Select-Object -ExpandProperty OwningProcess -First 1 | 
               ForEach-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue }
    
    if ($process) {
        Write-Host "[WARNING] Found existing $ServiceName on port $Port (PID: $($process.Id))" -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
        Write-Host "[OK] Killed $ServiceName" -ForegroundColor Green
        return $true
    }
    return $false
}

# Check and clean existing processes if needed
$BackendRunning = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue
$FrontendRunning = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue

if ($BackendRunning -or $FrontendRunning -or $Clean) {
    Write-Host ""
    Write-Host "[CHECKING] Checking for existing processes..." -ForegroundColor Yellow
    
    Stop-ProcessOnPort -Port $BackendPort -ServiceName "Backend"
    Stop-ProcessOnPort -Port $FrontendPort -ServiceName "Frontend"
    
    Start-Sleep -Seconds 1
}

# Start backend
Write-Host ""
Write-Host "[BACKEND] Starting Backend Server..." -ForegroundColor Cyan
$BackendPath = Join-Path $RootDir "backend"

try {
    Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $BackendPath -WindowStyle Hidden -ErrorAction Stop
    Write-Host "  Waiting for backend to initialize..." -ForegroundColor Gray
    $maxWait = 15
    $waited = 0
    while ($waited -lt $maxWait) {
        if (Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue) {
            Write-Host "[OK] Backend running on http://localhost:$BackendPort" -ForegroundColor Green
            break
        }
        Start-Sleep -Seconds 1
        $waited++
    }
    if ($waited -ge $maxWait) {
        Write-Host "[ERROR] Backend failed to start (timeout after 15s)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Error starting backend: $_" -ForegroundColor Red
    exit 1
}

# Start frontend
Write-Host ""
Write-Host "[FRONTEND] Starting Frontend Server..." -ForegroundColor Cyan
$FrontendPath = Join-Path $RootDir "frontend"

try {
    Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $FrontendPath -WindowStyle Hidden -ErrorAction Stop
    Write-Host "  Waiting for frontend to initialize..." -ForegroundColor Gray
    $maxWait = 15
    $waited = 0
    while ($waited -lt $maxWait) {
        if ((Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue) -or (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue)) {
            if (Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue) {
                Write-Host "[OK] Frontend running on http://localhost:$FrontendPort" -ForegroundColor Green
            } else {
                Write-Host "[OK] Frontend running on http://localhost:5173" -ForegroundColor Green
            }
            break
        }
        Start-Sleep -Seconds 1
        $waited++
    }
    if ($waited -ge $maxWait) {
        Write-Host "[WARNING] Frontend may still be starting (no response after 15s)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Error starting frontend: $_" -ForegroundColor Red
    exit 1
}

# Summary
Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "[SUCCESS] Both servers started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application:" -ForegroundColor Cyan
Write-Host "  Backend API:  http://localhost:3001" -ForegroundColor White
Write-Host "  Frontend UI:  http://localhost:5173 (or 5174)" -ForegroundColor White
Write-Host ""
Write-Host "To stop servers, run: .\shutdown.ps1" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

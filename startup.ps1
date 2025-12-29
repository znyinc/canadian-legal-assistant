# Canadian Legal Assistant - Startup Script
# Starts backend (port 3001) and frontend (port 5173/5174) dev servers
# Automatically kills any existing processes on those ports (use -Clean to force)

param(
    [switch]$Clean = $false  # If -Clean flag is used, kill existing processes and restart
)

$ErrorActionPreference = "SilentlyContinue"
$BackendPort = 3001
$FrontendPorts = @(5173, 5174) # Vite uses 5173 by default and 5174 as a fallback
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

# Check and clean existing processes if needed (including Vite fallback port)
$ExistingConnections = @()
foreach ($port in @($BackendPort) + $FrontendPorts) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) { $ExistingConnections += $conn }
}

if ($ExistingConnections -or $Clean) {
    Write-Host ""
    Write-Host "[CHECKING] Checking for existing processes..." -ForegroundColor Yellow
    
    Stop-ProcessOnPort -Port $BackendPort -ServiceName "Backend"
    foreach ($port in $FrontendPorts) {
        Stop-ProcessOnPort -Port $port -ServiceName "Frontend"
    }
    
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
    $activeFrontendPort = $null
    while ($waited -lt $maxWait) {
        foreach ($port in $FrontendPorts) {
            if (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue) {
                $activeFrontendPort = $port
                break
            }
        }
        if ($activeFrontendPort) { break }
        Start-Sleep -Seconds 1
        $waited++
    }
    if ($activeFrontendPort) {
        Write-Host "[OK] Frontend running on http://localhost:$activeFrontendPort" -ForegroundColor Green
    } else {
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
Write-Host "  Backend API:  http://localhost:$BackendPort" -ForegroundColor White
Write-Host "  Frontend UI:  http://localhost:$($FrontendPorts[0]) (or $($FrontendPorts[1]))" -ForegroundColor White
Write-Host ""
Write-Host "To stop servers, run: .\shutdown.ps1" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

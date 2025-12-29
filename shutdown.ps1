# Canadian Legal Assistant - Shutdown Script
# Gracefully stops backend and frontend dev servers
# Kills processes on ports 3001 (backend) and 5173/5174 (frontend)

$ErrorActionPreference = "SilentlyContinue"
$BackendPort = 3001
$FrontendPorts = @(5173, 5174) # Vite uses 5173 by default and 5174 as a fallback

Write-Host ""
Write-Host "[SHUTDOWN] Canadian Legal Assistant - Shutdown Script" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Function to find and kill process on a port
function Stop-ProcessOnPort {
    param([int]$Port, [string]$ServiceName)
    
    $processes = @()
    
    # Try to find process by port
    $netConnection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($netConnection) {
        $processes = $netConnection | 
                     Select-Object -ExpandProperty OwningProcess -Unique | 
                     ForEach-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue }
    }
    
    # Also check for npm processes (fallback)
    if (-not $processes) {
        $processes = Get-Process -Name "npm" -ErrorAction SilentlyContinue | 
                     Where-Object { $_.MainWindowTitle -like "*npm*" }
    }
    
    if ($processes) {
        foreach ($process in $processes) {
            Write-Host "[STOPPING] Stopping $ServiceName (PID: $($process.Id), Name: $($process.Name))" -ForegroundColor Yellow
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 300
        }
        Write-Host "[OK] $ServiceName stopped" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[SKIP] No $ServiceName found running on port $Port" -ForegroundColor Gray
        return $false
    }
}

# Stop services
Write-Host ""
Write-Host "[CHECKING] Checking for running services..." -ForegroundColor Cyan

Stop-ProcessOnPort -Port $BackendPort -ServiceName "Backend"
foreach ($port in $FrontendPorts) {
    Stop-ProcessOnPort -Port $port -ServiceName "Frontend"
}

# Verify ports are free
Start-Sleep -Seconds 1

$BackendCheck = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue
$FrontendChecks = @()
foreach ($port in $FrontendPorts) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) { $FrontendChecks += @{ Port = $port; Connection = $conn } }
}

if (-not $BackendCheck -and -not $FrontendChecks) {
    Write-Host ""
    Write-Host "[SUCCESS] All services stopped successfully" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[WARNING] Some services may still be running:" -ForegroundColor Yellow
    if ($BackendCheck) { Write-Host "  - Backend (port $BackendPort)" -ForegroundColor Yellow }
    foreach ($frontend in $FrontendChecks) {
        Write-Host "  - Frontend (port $($frontend.Port))" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "To restart servers, run: .\startup.ps1" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

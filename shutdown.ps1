# Canadian Legal Assistant - Shutdown Script
# Gracefully stops backend and frontend dev servers
# Kills processes on ports 3010 (backend) and 5173/5174 (frontend)

$ErrorActionPreference = "SilentlyContinue"
$BackendPort = 3010
$FrontendPort = 5174

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
Stop-ProcessOnPort -Port $FrontendPort -ServiceName "Frontend"

# Verify ports are free
Start-Sleep -Seconds 1

$BackendCheck = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue
$FrontendCheck = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue
$Frontend5173Check = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if (-not $BackendCheck -and -not $FrontendCheck -and -not $Frontend5173Check) {
    Write-Host ""
    Write-Host "[SUCCESS] All services stopped successfully" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[WARNING] Some services may still be running:" -ForegroundColor Yellow
    if ($BackendCheck) { Write-Host "  - Backend (port 3010)" -ForegroundColor Yellow }
    if ($FrontendCheck) { Write-Host "  - Frontend (port 5174)" -ForegroundColor Yellow }
    if ($Frontend5173Check) { Write-Host "  - Frontend (port 5173)" -ForegroundColor Yellow }
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "To restart servers, run: .\startup.ps1" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

[CmdletBinding()]
param(
    [int]$BackendPort = 3001,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $root ".devserver.pids.json"

function Write-Status {
    param(
        [Parameter(Mandatory = $true)][string]$Level,
        [Parameter(Mandatory = $true)][string]$Message
    )

    $color = switch ($Level.ToUpper()) {
        "OK" { "Green" }
        "WARN" { "Yellow" }
        "ERROR" { "Red" }
        default { "Cyan" }
    }

    Write-Host "[$Level] $Message" -ForegroundColor $color
}

function Get-PortProcess {
    param([int]$Port)

    try {
        $conn = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop | Select-Object -First 1
        if ($null -ne $conn) {
            return Get-Process -Id $conn.OwningProcess -ErrorAction Stop
        }
    } catch {
        return $null
    }

    return $null
}

function Wait-ForExit {
    param(
        [int]$TargetPid,
        [int]$TimeoutSeconds = 10
    )

    $timer = [System.Diagnostics.Stopwatch]::StartNew()
    while ($timer.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        if (-not (Get-Process -Id $TargetPid -ErrorAction SilentlyContinue)) {
            return $true
        }
        Start-Sleep -Milliseconds 400
    }

    return $false
}

function Stop-ServiceProcess {
    param(
        [string]$Name,
        [int]$Port,
        [Nullable[int]]$KnownPid,
        [Nullable[int]]$LaunchPid
    )

    $candidatePids = @()
    if ($KnownPid) { $candidatePids += $KnownPid }
    if ($LaunchPid) { $candidatePids += $LaunchPid }

    $targetPid = $null
    foreach ($candidate in $candidatePids) {
        $proc = Get-Process -Id $candidate -ErrorAction SilentlyContinue
        if ($proc) { $targetPid = $candidate; break }
    }

    if (-not $targetPid) {
        $portProc = Get-PortProcess -Port $Port
        if ($portProc) { $targetPid = $portProc.Id }
    }

    if (-not $targetPid) {
        Write-Status "OK" "$Name not running on port $Port."
        return $true
    }

    Write-Status "INFO" "Stopping $Name (PID $targetPid) on port $Port..."
    Stop-Process -Id $targetPid -ErrorAction SilentlyContinue

    if (Wait-ForExit -TargetPid $targetPid) {
        Write-Status "OK" "$Name stopped."
    } else {
        Write-Status "WARN" "$Name did not exit gracefully. Attempting force stop..."
        Stop-Process -Id $targetPid -Force -ErrorAction SilentlyContinue

        if (Wait-ForExit -TargetPid $targetPid) {
            Write-Status "OK" "$Name force stopped."
        } else {
            Write-Status "WARN" "Could not confirm $Name has stopped. Check port $Port manually."
        }
    }

    if ($LaunchPid -and $LaunchPid -ne $targetPid) {
        $consoleProc = Get-Process -Id $LaunchPid -ErrorAction SilentlyContinue
        if ($consoleProc) {
            Write-Status "INFO" "Closing $Name console window (PID $LaunchPid)..."
            Stop-Process -Id $LaunchPid -ErrorAction SilentlyContinue
            if (Wait-ForExit -TargetPid $LaunchPid) {
                Write-Status "OK" "$Name console closed."
            } else {
                Write-Status "WARN" "Could not confirm $Name console window closed."
            }
        }
    }

    return $true
}

Write-Status "INFO" "Stopping Canadian Legal Assistant development servers..."

$pidData = @{}
if (Test-Path $pidFile) {
    try { $pidData = Get-Content $pidFile -Raw | ConvertFrom-Json } catch { $pidData = @{} }
}

$backendPid = $null
$backendLaunch = $null
if ($pidData.backend) {
    if ($pidData.backend -is [int]) { $backendPid = [int]$pidData.backend }
    else { $backendPid = $pidData.backend.portPid; $backendLaunch = $pidData.backend.launchPid }
}

$frontendPid = $null
$frontendLaunch = $null
if ($pidData.frontend) {
    if ($pidData.frontend -is [int]) { $frontendPid = [int]$pidData.frontend }
    else { $frontendPid = $pidData.frontend.portPid; $frontendLaunch = $pidData.frontend.launchPid }
}

$backendStopped = Stop-ServiceProcess -Name "Backend" -Port $BackendPort -KnownPid $backendPid -LaunchPid $backendLaunch
$frontendStopped = Stop-ServiceProcess -Name "Frontend" -Port $FrontendPort -KnownPid $frontendPid -LaunchPid $frontendLaunch

if ($backendStopped -and $frontendStopped) {
    if (Test-Path $pidFile) { Remove-Item $pidFile -Force }
    Write-Status "OK" "Shutdown complete. Ports $BackendPort and $FrontendPort are available."
} else {
    Write-Status "WARN" "Shutdown finished with warnings. Verify ports $BackendPort/$FrontendPort are free."
}

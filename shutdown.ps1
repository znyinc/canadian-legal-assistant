[CmdletBinding()]
param(
    [int]$BackendPort = 3001,
    [int]$FrontendPort = 5173,
    [int]$LiteLlmPort = 4000
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $root ".devserver.pids.json"
$liteLlmConfigFile = Join-Path $root ".litellm.proxy.generated.yaml"
$liteLlmLaunchScriptFile = Join-Path $root ".litellm.launch.generated.ps1"

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

function Wait-ForPortRelease {
    param(
        [int]$Port,
        [int]$TimeoutSeconds = 15
    )

    $timer = [System.Diagnostics.Stopwatch]::StartNew()
    while ($timer.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        if (-not (Get-PortProcess -Port $Port)) {
            return $true
        }
        Start-Sleep -Milliseconds 400
    }

    return $false
}

function Close-WindowGracefully {
    param(
        [int]$TargetPid,
        [string]$Name,
        [int]$TimeoutSeconds = 10
    )

    $proc = Get-Process -Id $TargetPid -ErrorAction SilentlyContinue
    if (-not $proc) {
        return $true
    }

    if (-not $proc.MainWindowHandle -or $proc.MainWindowHandle -eq 0) {
        return $false
    }

    Write-Status "INFO" "Closing $Name window gracefully (PID $TargetPid)..."

    try {
        if (-not $proc.CloseMainWindow()) {
            return $false
        }
    } catch {
        return $false
    }

    return (Wait-ForExit -TargetPid $TargetPid -TimeoutSeconds $TimeoutSeconds)
}

function Stop-ProcessTree {
    param(
        [int]$TargetPid,
        [string]$Name
    )

    if (-not (Get-Process -Id $TargetPid -ErrorAction SilentlyContinue)) {
        return $true
    }

    Write-Status "INFO" "Stopping $Name process tree (PID $TargetPid)..."
    $taskkill = Start-Process -FilePath "taskkill.exe" -ArgumentList @('/PID', $TargetPid, '/T', '/F') -NoNewWindow -PassThru -Wait -ErrorAction SilentlyContinue
    if ($taskkill -and $taskkill.ExitCode -eq 0) {
        return $true
    }

    Stop-Process -Id $TargetPid -Force -ErrorAction SilentlyContinue
    return (Wait-ForExit -TargetPid $TargetPid)
}

function Stop-ServiceProcess {
    param(
        [string]$Name,
        [int]$Port,
        [Nullable[int]]$KnownPid,
        [Nullable[int]]$LaunchPid
    )

    $portProc = Get-PortProcess -Port $Port
    $targetPid = $null
    if ($portProc) {
        $targetPid = $portProc.Id
    }

    if (-not $targetPid -and $KnownPid) {
        $knownProc = Get-Process -Id $KnownPid -ErrorAction SilentlyContinue
        if ($knownProc) {
            $targetPid = $KnownPid
        }
    }

    if (-not $targetPid -and $LaunchPid) {
        $launchProc = Get-Process -Id $LaunchPid -ErrorAction SilentlyContinue
        if ($launchProc) {
            $targetPid = $LaunchPid
        }
    }

    if (-not $targetPid) {
        Write-Status "OK" "$Name not running on port $Port."
        return $true
    }

    $launchClosedGracefully = $false
    if ($LaunchPid -and $LaunchPid -ne $targetPid) {
        $launchClosedGracefully = Close-WindowGracefully -TargetPid $LaunchPid -Name "$Name console"
        if ($launchClosedGracefully) {
            Write-Status "OK" "$Name console closed gracefully."
            if (Wait-ForPortRelease -Port $Port -TimeoutSeconds 10) {
                Write-Status "OK" "$Name stopped after console close."
                return $true
            }
        }
    }

    if (Stop-ProcessTree -TargetPid $targetPid -Name $Name) {
        Write-Status "OK" "$Name stopped."
    } else {
        Write-Status "WARN" "Could not confirm $Name has stopped. Check port $Port manually."
    }

    if ($LaunchPid -and $LaunchPid -ne $targetPid -and -not $launchClosedGracefully) {
        $consoleProc = Get-Process -Id $LaunchPid -ErrorAction SilentlyContinue
        if ($consoleProc) {
            if (Close-WindowGracefully -TargetPid $LaunchPid -Name "$Name console") {
                Write-Status "OK" "$Name console closed gracefully."
            } elseif (Stop-ProcessTree -TargetPid $LaunchPid -Name "$Name console") {
                Write-Status "OK" "$Name console closed."
            } else {
                Write-Status "WARN" "Could not confirm $Name console window closed."
            }
        }
    }

    if (-not (Wait-ForPortRelease -Port $Port)) {
        Write-Status "WARN" "Port $Port is still in use after stopping $Name."
        return $false
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

$liteLlmPid = $null
$liteLlmLaunch = $null
if ($pidData.litellm) {
    if ($pidData.litellm -is [int]) { $liteLlmPid = [int]$pidData.litellm }
    else { $liteLlmPid = $pidData.litellm.portPid; $liteLlmLaunch = $pidData.litellm.launchPid }
}

$frontendStopped = Stop-ServiceProcess -Name "Frontend" -Port $FrontendPort -KnownPid $frontendPid -LaunchPid $frontendLaunch
$backendStopped = Stop-ServiceProcess -Name "Backend" -Port $BackendPort -KnownPid $backendPid -LaunchPid $backendLaunch
$liteLlmStopped = Stop-ServiceProcess -Name "LiteLLM" -Port $LiteLlmPort -KnownPid $liteLlmPid -LaunchPid $liteLlmLaunch

if ($backendStopped -and $frontendStopped -and $liteLlmStopped) {
    if (Test-Path $pidFile) { Remove-Item $pidFile -Force }
    if (Test-Path $liteLlmConfigFile) { Remove-Item $liteLlmConfigFile -Force -ErrorAction SilentlyContinue }
    if (Test-Path $liteLlmLaunchScriptFile) { Remove-Item $liteLlmLaunchScriptFile -Force -ErrorAction SilentlyContinue }
    Write-Status "OK" "Shutdown complete. Ports $LiteLlmPort, $BackendPort, and $FrontendPort are available."
} else {
    Write-Status "WARN" "Shutdown finished with warnings. Verify ports $LiteLlmPort/$BackendPort/$FrontendPort are free."
}

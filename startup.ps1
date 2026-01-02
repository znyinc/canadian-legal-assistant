[CmdletBinding()]
param(
    [switch]$Clean,
    [int]$BackendPort = 3001,
    [int]$FrontendPort = 5173,
    [switch]$ShowConsole
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

function Wait-ForPort {
    param(
        [int]$Port,
        [int]$TimeoutSeconds = 60,
        $ExitCheckProcess
    )

    $timer = [System.Diagnostics.Stopwatch]::StartNew()
    while ($timer.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        if ($ExitCheckProcess -and $ExitCheckProcess.HasExited) { return $null }
        $proc = Get-PortProcess -Port $Port
        if ($null -ne $proc) {
            return $proc
        }
        Start-Sleep -Milliseconds 500
    }

    return $null
}

function Start-ServiceProcess {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [int]$Port,
        [string[]]$Arguments,
        [switch]$ShowConsole
    )

    $existing = Get-PortProcess -Port $Port
    if ($existing -and -not $Clean) {
        Write-Status "WARN" "$Name already running on port $Port (PID $($existing.Id)). Skipping start. Use -Clean to restart."
        return @{ PortPid = $existing.Id; LaunchPid = $existing.Id; Status = "existing" }
    }

    if ($existing -and $Clean) {
        Write-Status "INFO" "Stopping existing $Name on port $Port (PID $($existing.Id)) before restart..."
        Stop-Process -Id $existing.Id -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }

    $npmArgsDisplay = ($Arguments -join ' ')
    if ($ShowConsole) {
        $psCommand = "Set-Location -LiteralPath `"$WorkingDirectory`"; npm $npmArgsDisplay"
        Write-Status "INFO" "Starting $Name in visible console (npm $npmArgsDisplay)..."
        $process = Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoLogo", "-NoProfile", "-NoExit", "-Command", $psCommand) -WorkingDirectory $WorkingDirectory -WindowStyle Normal -PassThru -ErrorAction Stop
    } else {
        $npm = Get-Command "npm.cmd" -ErrorAction Stop
        Write-Status "INFO" "Starting $Name (npm $npmArgsDisplay) from $WorkingDirectory..."
        $process = Start-Process -FilePath $npm.Source -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -WindowStyle Hidden -PassThru -ErrorAction Stop
    }

    $listener = Wait-ForPort -Port $Port -ExitCheckProcess $process

    if ($listener) {
        Write-Status "OK" "$Name running on port $Port (PID $($listener.Id))."
    } else {
        if ($process.HasExited) {
            Write-Status "ERROR" "$Name process exited early with code $($process.ExitCode). Check logs by running 'npm run dev' manually in $WorkingDirectory."
        } else {
            Write-Status "WARN" "$Name start command issued but port $Port did not open within timeout."
        }
    }

    $portPid = $null
    if ($listener) { $portPid = $listener.Id }

    return @{ PortPid = $portPid; LaunchPid = $process.Id; Status = "started" }
}

Write-Status "INFO" "Starting Canadian Legal Assistant development servers..."

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Status "ERROR" "npm is not available on PATH. Install Node.js and retry."
    exit 1
}

$pidData = @{}
if (Test-Path $pidFile) {
    try { $pidData = Get-Content $pidFile -Raw | ConvertFrom-Json } catch { $pidData = @{} }
}

$backend = Start-ServiceProcess -Name "Backend" -WorkingDirectory (Join-Path $root "backend") -Port $BackendPort -Arguments @("run", "dev") -ShowConsole:$ShowConsole
$frontendArgs = @("run", "dev", "--", "--host", "--port", $FrontendPort)
$frontend = Start-ServiceProcess -Name "Frontend" -WorkingDirectory (Join-Path $root "frontend") -Port $FrontendPort -Arguments $frontendArgs -ShowConsole:$ShowConsole

if ($backend) { $pidData.backend = @{ portPid = $backend.PortPid; launchPid = $backend.LaunchPid } }
if ($frontend) { $pidData.frontend = @{ portPid = $frontend.PortPid; launchPid = $frontend.LaunchPid } }

if ($pidData.Count -gt 0) {
    $pidData | ConvertTo-Json -Depth 3 | Set-Content -Path $pidFile -Encoding ASCII
    Write-Status "INFO" "Saved process info to $($pidFile | Split-Path -Leaf)."
}

Write-Status "OK" "Startup routine complete. Backend: http://localhost:$BackendPort | Frontend: http://localhost:$FrontendPort"

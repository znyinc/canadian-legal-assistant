[CmdletBinding()]
param(
    [switch]$Clean,
    [int]$BackendPort = 3001,
    [int]$FrontendPort = 5173,
    [Nullable[int]]$LiteLlmPort,
    [int]$LiteLlmStartupTimeoutSeconds = 120,
    [switch]$SkipLiteLlm,
    [switch]$ShowConsole,
    [switch]$HideConsole
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $root ".devserver.pids.json"
$backendEnvFile = Join-Path $root "backend\.env"
$liteLlmConfigFile = Join-Path $root ".litellm.proxy.generated.yaml"
$liteLlmLaunchScriptFile = Join-Path $root ".litellm.launch.generated.ps1"

if (-not $PSBoundParameters.ContainsKey('Clean')) {
    $Clean = $true
}

if (-not $PSBoundParameters.ContainsKey('ShowConsole') -and -not $PSBoundParameters.ContainsKey('HideConsole')) {
    $ShowConsole = $true
}

if ($HideConsole) {
    $ShowConsole = $false
}

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

function Read-EnvFile {
    param([string]$Path)

    $values = @{}
    if (-not (Test-Path $Path)) {
        return $values
    }

    foreach ($line in Get-Content -Path $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) {
            continue
        }

        $parts = $trimmed -split '=', 2
        if ($parts.Count -ne 2) {
            continue
        }

        $name = $parts[0].Trim()
        $value = $parts[1].Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        $values[$name] = $value
    }

    return $values
}

function Set-ProcessEnvironmentFromMap {
    param(
        [hashtable]$Values,
        [string[]]$ExcludeKeys = @()
    )

    foreach ($entry in $Values.GetEnumerator()) {
        if ($ExcludeKeys -contains $entry.Key) {
            continue
        }
        Set-Item -Path ("Env:{0}" -f $entry.Key) -Value $entry.Value
        [System.Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'Process')
    }
}

function Get-PortFromUrl {
    param(
        [string]$Url,
        [int]$DefaultPort
    )

    if (-not $Url) {
        return $DefaultPort
    }

    $uri = $null
    if ([System.Uri]::TryCreate($Url, [System.UriKind]::Absolute, [ref]$uri) -and $uri.Port -gt 0) {
        return $uri.Port
    }

    return $DefaultPort
}

function Test-LiteLlmProxyRuntime {
    param(
        [Parameter(Mandatory = $true)][string]$PythonPath
    )

    if (-not (Test-Path $PythonPath -PathType Leaf)) {
        return $false
    }

    try {
        & $PythonPath -c "import litellm.proxy.proxy_server" *> $null
        return ($LASTEXITCODE -eq 0)
    } catch {
        return $false
    }
}

function Resolve-LiteLlmCommand {
    param([string]$Root)

    $venvLiteLlm = Join-Path $Root '.venv\Scripts\litellm.exe'
    if (Test-Path $venvLiteLlm -PathType Leaf) {
        return @{
            FilePath = $venvLiteLlm
            PrefixArguments = @()
            Display = 'repo venv litellm'
            Source = 'repo-venv-exe'
        }
    }

    $venvPython = Join-Path $Root '.venv\Scripts\python.exe'
    if (Test-LiteLlmProxyRuntime -PythonPath $venvPython) {
        return @{
            FilePath = $venvPython
            PrefixArguments = @('-m', 'litellm')
            Display = 'repo venv python -m litellm'
            Source = 'repo-venv'
        }
    }

    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCommand -and (Test-LiteLlmProxyRuntime -PythonPath $pythonCommand.Source)) {
        return @{
            FilePath = $pythonCommand.Source
            PrefixArguments = @('-m', 'litellm')
            Display = 'python -m litellm'
            Source = 'python-path'
        }
    }

    $liteLlmCommand = Get-Command litellm -ErrorAction SilentlyContinue
    if ($liteLlmCommand) {
        throw 'Found LiteLLM at ''{0}'', but it is missing proxy dependencies. Install into the repo venv with: .venv\Scripts\python.exe -m pip install "litellm[proxy]" or run startup with -SkipLiteLlm.' -f $liteLlmCommand.Source
    }

    throw 'LiteLLM proxy runtime was not found. Install it into the repo venv with: .venv\Scripts\python.exe -m pip install "litellm[proxy]" or run startup with -SkipLiteLlm.'
}

function Resolve-PowerShellHost {
    $pwsh = Get-Command pwsh -ErrorAction SilentlyContinue
    if ($pwsh) {
        return $pwsh.Source
    }

    $powershell = Get-Command powershell -ErrorAction SilentlyContinue
    if ($powershell) {
        return $powershell.Source
    }

    throw 'PowerShell executable was not found on PATH.'
}

function New-LiteLlmProviderCandidate {
    param(
        [Parameter(Mandatory = $true)][string]$Provider,
        [Parameter(Mandatory = $true)][string]$Model,
        [string]$ApiBaseEnv,
        [string]$ApiKeyEnv
    )

    return @{
        provider = $Provider
        model = $Model
        apiBaseEnv = $ApiBaseEnv
        apiKeyEnv = $ApiKeyEnv
    }
}

function Get-ExplicitLiteLlmProviderCandidate {
    param(
        [hashtable]$EnvMap,
        [string]$Tier,
        [string]$RequestedProvider
    )

    if ([string]::IsNullOrWhiteSpace($RequestedProvider)) {
        return $null
    }

    $modelSuffix = if ($Tier -eq 'FAST') { 'FAST_MODEL' } else { 'SMART_MODEL' }

    switch ($RequestedProvider.Trim().ToLowerInvariant()) {
        'auto' {
            return $null
        }
        'openai' {
            if ($EnvMap.OPENAI_API_KEY -and $EnvMap["OPENAI_$modelSuffix"]) {
                return New-LiteLlmProviderCandidate -Provider 'openai' -Model $EnvMap["OPENAI_$modelSuffix"] -ApiBaseEnv 'OPENAI_BASE_URL' -ApiKeyEnv 'OPENAI_API_KEY'
            }

            throw "LITELLM_${Tier}_PROVIDER=openai requires OPENAI_API_KEY and OPENAI_${modelSuffix} in backend/.env."
        }
        'anthropic' {
            $modelKey = if ($Tier -eq 'FAST') { 'CLAUDE_FAST_MODEL' } else { 'CLAUDE_SMART_MODEL' }
            if ($EnvMap.ANTHROPIC_API_KEY -and $EnvMap[$modelKey]) {
                return New-LiteLlmProviderCandidate -Provider 'anthropic' -Model $EnvMap[$modelKey] -ApiBaseEnv 'ANTHROPIC_BASE_URL' -ApiKeyEnv 'ANTHROPIC_API_KEY'
            }

            throw "LITELLM_${Tier}_PROVIDER=anthropic requires ANTHROPIC_API_KEY and $modelKey in backend/.env."
        }
        'gemini' {
            $modelKey = if ($Tier -eq 'FAST') { 'GEMINI_FAST_MODEL' } else { 'GEMINI_SMART_MODEL' }
            if ($EnvMap.GEMINI_API_KEY -and $EnvMap[$modelKey]) {
                return New-LiteLlmProviderCandidate -Provider 'gemini' -Model $EnvMap[$modelKey] -ApiBaseEnv 'GEMINI_BASE_URL' -ApiKeyEnv 'GEMINI_API_KEY'
            }

            throw "LITELLM_${Tier}_PROVIDER=gemini requires GEMINI_API_KEY and $modelKey in backend/.env."
        }
        'ollama' {
            $modelKey = if ($Tier -eq 'FAST') { 'OLLAMA_FAST_MODEL' } else { 'OLLAMA_SMART_MODEL' }
            if ($EnvMap.OLLAMA_BASE_URL -and $EnvMap[$modelKey]) {
                return New-LiteLlmProviderCandidate -Provider 'ollama' -Model $EnvMap[$modelKey] -ApiBaseEnv 'OLLAMA_BASE_URL'
            }

            throw "LITELLM_${Tier}_PROVIDER=ollama requires OLLAMA_BASE_URL and $modelKey in backend/.env."
        }
        default {
            throw "Unsupported LITELLM_${Tier}_PROVIDER '$RequestedProvider'. Use auto, openai, anthropic, gemini, or ollama."
        }
    }
}

function Get-LiteLlmProviderCandidate {
    param(
        [hashtable]$EnvMap,
        [string]$Tier
    )

    $requestedProviderKey = if ($Tier -eq 'FAST') { 'LITELLM_FAST_PROVIDER' } else { 'LITELLM_SMART_PROVIDER' }
    $explicitCandidate = Get-ExplicitLiteLlmProviderCandidate -EnvMap $EnvMap -Tier $Tier -RequestedProvider $EnvMap[$requestedProviderKey]
    if ($explicitCandidate) {
        return $explicitCandidate
    }

    $modelSuffix = if ($Tier -eq 'FAST') { 'FAST_MODEL' } else { 'SMART_MODEL' }

    if ($EnvMap.OPENAI_API_KEY -and $EnvMap["OPENAI_$modelSuffix"]) {
        return New-LiteLlmProviderCandidate -Provider 'openai' -Model $EnvMap["OPENAI_$modelSuffix"] -ApiBaseEnv 'OPENAI_BASE_URL' -ApiKeyEnv 'OPENAI_API_KEY'
    }

    if ($EnvMap.ANTHROPIC_API_KEY -and $EnvMap[(if ($Tier -eq 'FAST') { 'CLAUDE_FAST_MODEL' } else { 'CLAUDE_SMART_MODEL' })]) {
        return New-LiteLlmProviderCandidate -Provider 'anthropic' -Model $EnvMap[(if ($Tier -eq 'FAST') { 'CLAUDE_FAST_MODEL' } else { 'CLAUDE_SMART_MODEL' })] -ApiBaseEnv 'ANTHROPIC_BASE_URL' -ApiKeyEnv 'ANTHROPIC_API_KEY'
    }

    if ($EnvMap.GEMINI_API_KEY -and $EnvMap[(if ($Tier -eq 'FAST') { 'GEMINI_FAST_MODEL' } else { 'GEMINI_SMART_MODEL' })]) {
        return New-LiteLlmProviderCandidate -Provider 'gemini' -Model $EnvMap[(if ($Tier -eq 'FAST') { 'GEMINI_FAST_MODEL' } else { 'GEMINI_SMART_MODEL' })] -ApiBaseEnv 'GEMINI_BASE_URL' -ApiKeyEnv 'GEMINI_API_KEY'
    }

    if ($EnvMap.OLLAMA_BASE_URL -and $EnvMap[(if ($Tier -eq 'FAST') { 'OLLAMA_FAST_MODEL' } else { 'OLLAMA_SMART_MODEL' })]) {
        return New-LiteLlmProviderCandidate -Provider 'ollama' -Model $EnvMap[(if ($Tier -eq 'FAST') { 'OLLAMA_FAST_MODEL' } else { 'OLLAMA_SMART_MODEL' })] -ApiBaseEnv 'OLLAMA_BASE_URL'
    }

    return $null
}

function Write-LiteLlmProxyConfig {
    param(
        [hashtable]$EnvMap,
        [string]$Path
    )

    $fastAlias = if ($EnvMap.LITELLM_FAST_MODEL) { $EnvMap.LITELLM_FAST_MODEL } else { 'litellm-fast' }
    $smartAlias = if ($EnvMap.LITELLM_SMART_MODEL) { $EnvMap.LITELLM_SMART_MODEL } else { 'litellm-smart' }

    $fastProvider = Get-LiteLlmProviderCandidate -EnvMap $EnvMap -Tier 'FAST'
    $smartProvider = Get-LiteLlmProviderCandidate -EnvMap $EnvMap -Tier 'SMART'

    if (-not $fastProvider -or -not $smartProvider) {
        throw "LiteLLM could not determine upstream models for both FAST and SMART aliases from backend/.env."
    }

    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add('model_list:')

    foreach ($entry in @(
        @{ alias = $fastAlias; provider = $fastProvider },
        @{ alias = $smartAlias; provider = $smartProvider }
    )) {
        $provider = $entry.provider
        $lines.Add("  - model_name: $($entry.alias)")
        $lines.Add('    litellm_params:')
        $lines.Add("      model: $($provider.provider)/$($provider.model)")
        if ($provider.apiBaseEnv) {
            $lines.Add("      api_base: os.environ/$($provider.apiBaseEnv)")
        }
        if ($provider.apiKeyEnv) {
            $lines.Add("      api_key: os.environ/$($provider.apiKeyEnv)")
        }
    }

    if ($EnvMap.LITELLM_API_KEY) {
        $lines.Add('general_settings:')
        $lines.Add('  master_key: os.environ/LITELLM_API_KEY')
    }

    Set-Content -Path $Path -Value $lines -Encoding ASCII

    return @{
        fastAlias = $fastAlias
        smartAlias = $smartAlias
        fastProvider = $fastProvider.provider
        smartProvider = $smartProvider.provider
        path = $Path
    }
}

function Write-LiteLlmLaunchScript {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Root,
        [Parameter(Mandatory = $true)][string]$ExecutablePath,
        [Parameter(Mandatory = $true)][string]$ConfigPath,
        [Parameter(Mandatory = $true)][string]$EnvFilePath,
        [Parameter(Mandatory = $true)][int]$Port
    )

    $escapedRoot = $Root -replace "'", "''"
    $escapedExecutable = $ExecutablePath -replace "'", "''"
    $escapedConfig = $ConfigPath -replace "'", "''"
    $escapedEnvFile = $EnvFilePath -replace "'", "''"

    $content = @(
        '$ErrorActionPreference = ''Stop''',
        "Set-Location '$escapedRoot'",
        "if (Test-Path '$escapedEnvFile') {",
        "    foreach (`$line in Get-Content '$escapedEnvFile') {",
        '        $trimmed = $line.Trim()',
        '        if (-not $trimmed -or $trimmed.StartsWith(''#'')) { continue }',
        '        $parts = $trimmed -split ''='', 2',
        '        if ($parts.Count -ne 2) { continue }',
        '        $name = $parts[0].Trim()',
        '        if ($name -in @(''DATABASE_URL'', ''DIRECT_URL'')) { continue }',
        '        $value = $parts[1].Trim()',
        '        if (($value.StartsWith(''"'') -and $value.EndsWith(''"'')) -or ($value.StartsWith("''") -and $value.EndsWith("''"))) {',
        '            $value = $value.Substring(1, $value.Length - 2)',
        '        }',
        '        Set-Item -Path ("Env:{0}" -f $name) -Value $value',
        '        [System.Environment]::SetEnvironmentVariable($name, $value, ''Process'')',
        '    }',
        '}',
        'Set-Item -Path Env:LITELLM_MODE -Value ''PRODUCTION''',
        '[System.Environment]::SetEnvironmentVariable(''LITELLM_MODE'', ''PRODUCTION'', ''Process'')',
        'Set-Item -Path Env:LITELLM_WORKER_STARTUP_HOOKS -Value ''litellm_startup_hook:clear_database_env''',
        '[System.Environment]::SetEnvironmentVariable(''LITELLM_WORKER_STARTUP_HOOKS'', ''litellm_startup_hook:clear_database_env'', ''Process'')',
        'Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue',
        '[System.Environment]::SetEnvironmentVariable(''DATABASE_URL'', $null, ''Process'')',
        'Remove-Item Env:DIRECT_URL -ErrorAction SilentlyContinue',
        '[System.Environment]::SetEnvironmentVariable(''DIRECT_URL'', $null, ''Process'')',
        "& '$escapedExecutable' --config '$escapedConfig' --host 127.0.0.1 --port $Port"
    ) -join [Environment]::NewLine

    Set-Content -Path $Path -Value $content -Encoding ASCII
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

function Stop-ProcessTree {
    param(
        [int]$TargetPid,
        [string]$Label
    )

    if (-not (Get-Process -Id $TargetPid -ErrorAction SilentlyContinue)) {
        return $true
    }

    Write-Status "INFO" "Stopping $Label process tree (PID $TargetPid)..."

    $taskkill = Start-Process -FilePath "taskkill.exe" -ArgumentList @('/PID', $TargetPid, '/T', '/F') -NoNewWindow -PassThru -Wait -ErrorAction SilentlyContinue
    if ($taskkill -and $taskkill.ExitCode -eq 0) {
        return $true
    }

    Stop-Process -Id $TargetPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
    return -not (Get-Process -Id $TargetPid -ErrorAction SilentlyContinue)
}

function Test-HttpReady {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 30,
        $ExitCheckProcess
    )

    $timer = [System.Diagnostics.Stopwatch]::StartNew()
    while ($timer.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        if ($ExitCheckProcess -and $ExitCheckProcess.HasExited) {
            return $false
        }

        try {
            $response = Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
                return $true
            }
        } catch {
            Start-Sleep -Milliseconds 500
            continue
        }
    }

    return $false
}

function Start-ServiceProcess {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [int]$Port,
        [string[]]$Arguments,
        [string]$FilePath = 'npm.cmd',
        [string]$DisplayCommand,
        [switch]$ShowConsole,
        [ValidateSet('Hidden', 'Normal', 'Minimized', 'Maximized')][string]$ProcessWindowStyle = 'Hidden',
        [string]$HealthUrl,
        [switch]$AllowSoftHealthFailure,
        [switch]$NoWait,
        [int]$PortTimeoutSeconds = 60
    )

    $existing = Get-PortProcess -Port $Port
    if ($existing -and -not $Clean) {
        Write-Status "WARN" "$Name already running on port $Port (PID $($existing.Id)). Skipping start. Use -Clean to restart."
        return @{ PortPid = $existing.Id; LaunchPid = $existing.Id; Status = "existing" }
    }

    if ($existing -and $Clean) {
        $stopped = Stop-ProcessTree -TargetPid $existing.Id -Label $Name
        if (-not $stopped -or -not (Wait-ForPortRelease -Port $Port)) {
            Write-Status "ERROR" "Could not free port $Port for $Name. Run shutdown script and retry."
            return @{ PortPid = $null; LaunchPid = $null; Status = "failed" }
        }
    }

    $commandArgsDisplay = ($Arguments -join ' ')
    $statusCommand = if ($DisplayCommand) { $DisplayCommand } elseif ($FilePath -like '*npm*') { "npm $commandArgsDisplay" } else { "$FilePath $commandArgsDisplay" }
    if ($ShowConsole) {
        $shellCommand = if ($FilePath -like '*npm*') {
            "npm $commandArgsDisplay"
        } else {
            $quotedArgs = @()
            foreach ($argument in $Arguments) {
                $text = [string]$argument
                if ($text -match '[\s"]') {
                    $quotedArgs += ('"' + ($text -replace '"', '\"') + '"')
                } else {
                    $quotedArgs += $text
                }
            }

            $quotedFilePath = '"' + $FilePath + '"'
            if ($quotedArgs.Count -gt 0) {
                "$quotedFilePath $($quotedArgs -join ' ')"
            } else {
                $quotedFilePath
            }
        }

        $cmdCommand = "cd /d `"$WorkingDirectory`" && $shellCommand"
        Write-Status "INFO" "Starting $Name in visible console ($statusCommand)..."
        $process = Start-Process -FilePath "cmd.exe" -ArgumentList @('/k', $cmdCommand) -WorkingDirectory $WorkingDirectory -WindowStyle Normal -PassThru -ErrorAction Stop
    } else {
        $resolvedFilePath = $FilePath
        if (-not (Test-Path $resolvedFilePath -PathType Leaf)) {
            $command = Get-Command $FilePath -ErrorAction Stop
            $resolvedFilePath = $command.Source
        }
        Write-Status "INFO" "Starting $Name ($statusCommand) from $WorkingDirectory..."
        $process = Start-Process -FilePath $resolvedFilePath -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -WindowStyle $ProcessWindowStyle -PassThru -ErrorAction Stop
    }

    if ($NoWait) {
        return @{
            Name = $Name
            Port = $Port
            Process = $process
            HealthUrl = $HealthUrl
            AllowSoftHealthFailure = $AllowSoftHealthFailure
            PortTimeoutSeconds = $PortTimeoutSeconds
            Status = 'launched'
        }
    }

    $listener = Wait-ForPort -Port $Port -TimeoutSeconds $PortTimeoutSeconds -ExitCheckProcess $process

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

    if ($HealthUrl -and $listener) {
        if (Test-HttpReady -Url $HealthUrl -TimeoutSeconds 30 -ExitCheckProcess $process) {
            Write-Status "OK" "$Name passed HTTP health check at $HealthUrl."
        } else {
            if ($AllowSoftHealthFailure -and $portPid) {
                Write-Status "WARN" "$Name opened port $Port but did not pass HTTP health check at $HealthUrl within the timeout. Leaving it running so you can inspect the visible terminal."
                return @{ PortPid = $portPid; LaunchPid = $process.Id; Status = "started-soft" }
            }

            Write-Status "ERROR" "$Name did not return a healthy HTTP response at $HealthUrl."
            if ($portPid) {
                Stop-ProcessTree -TargetPid $portPid -Label $Name | Out-Null
                Wait-ForPortRelease -Port $Port | Out-Null
            }
            return @{ PortPid = $null; LaunchPid = $process.Id; Status = "failed" }
        }
    }

    return @{ PortPid = $portPid; LaunchPid = $process.Id; Status = "started" }
}

function Complete-ServiceStartup {
    param($LaunchResult)

    if (-not $LaunchResult) {
        return @{ PortPid = $null; LaunchPid = $null; Status = 'failed' }
    }

    if ($LaunchResult.Status -ne 'launched') {
        return $LaunchResult
    }

    $process = $LaunchResult.Process
    $portTimeoutSeconds = if ($LaunchResult.PortTimeoutSeconds) { [int]$LaunchResult.PortTimeoutSeconds } else { 60 }
    $listener = Wait-ForPort -Port $LaunchResult.Port -TimeoutSeconds $portTimeoutSeconds -ExitCheckProcess $process

    if ($listener) {
        Write-Status 'OK' "$($LaunchResult.Name) running on port $($LaunchResult.Port) (PID $($listener.Id))."
    } else {
        if ($process.HasExited) {
            Write-Status 'ERROR' "$($LaunchResult.Name) process exited early with code $($process.ExitCode)."
        } else {
            Write-Status 'WARN' "$($LaunchResult.Name) start command issued but port $($LaunchResult.Port) did not open within timeout."
        }
        return @{ PortPid = $null; LaunchPid = $process.Id; Status = 'failed' }
    }

    $portPid = $listener.Id
    if ($LaunchResult.HealthUrl) {
        if (Test-HttpReady -Url $LaunchResult.HealthUrl -TimeoutSeconds 30 -ExitCheckProcess $process) {
            Write-Status 'OK' "$($LaunchResult.Name) passed HTTP health check at $($LaunchResult.HealthUrl)."
        } else {
            if ($LaunchResult.AllowSoftHealthFailure -and $portPid) {
                Write-Status 'WARN' "$($LaunchResult.Name) opened port $($LaunchResult.Port) but did not pass HTTP health check at $($LaunchResult.HealthUrl) within the timeout. Leaving it running so you can inspect the visible terminal."
                return @{ PortPid = $portPid; LaunchPid = $process.Id; Status = 'started-soft' }
            }

            Write-Status 'ERROR' "$($LaunchResult.Name) did not return a healthy HTTP response at $($LaunchResult.HealthUrl)."
            Stop-ProcessTree -TargetPid $portPid -Label $LaunchResult.Name | Out-Null
            Wait-ForPortRelease -Port $LaunchResult.Port | Out-Null
            return @{ PortPid = $null; LaunchPid = $process.Id; Status = 'failed' }
        }
    }

    return @{ PortPid = $portPid; LaunchPid = $process.Id; Status = 'started' }
}

Write-Status "INFO" "Starting Canadian Legal Assistant development servers..."

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Status "ERROR" "npm is not available on PATH. Install Node.js and retry."
    exit 1
}

$backendEnv = Read-EnvFile -Path $backendEnvFile
[void](Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue)
[System.Environment]::SetEnvironmentVariable('DATABASE_URL', $null, 'Process')
[void](Remove-Item Env:DIRECT_URL -ErrorAction SilentlyContinue)
[System.Environment]::SetEnvironmentVariable('DIRECT_URL', $null, 'Process')
[void](Set-Item -Path Env:LITELLM_MODE -Value 'PRODUCTION')
[System.Environment]::SetEnvironmentVariable('LITELLM_MODE', 'PRODUCTION', 'Process')
[void](Set-Item -Path Env:LITELLM_WORKER_STARTUP_HOOKS -Value 'litellm_startup_hook:clear_database_env')
[System.Environment]::SetEnvironmentVariable('LITELLM_WORKER_STARTUP_HOOKS', 'litellm_startup_hook:clear_database_env', 'Process')
Set-ProcessEnvironmentFromMap -Values $backendEnv -ExcludeKeys @('DATABASE_URL', 'DIRECT_URL')

if (-not $LiteLlmPort.HasValue) {
    $LiteLlmPort = Get-PortFromUrl -Url $backendEnv.LITELLM_BASE_URL -DefaultPort 4000
}

$pidData = @{}

$liteLlmLaunch = $null
if (-not $SkipLiteLlm) {
    try {
        $liteLlmCommand = Resolve-LiteLlmCommand -Root $root
        $proxyConfig = Write-LiteLlmProxyConfig -EnvMap $backendEnv -Path $liteLlmConfigFile
        Write-Status 'INFO' "LiteLLM aliases will route FAST via $($proxyConfig.fastProvider) and SMART via $($proxyConfig.smartProvider)."
        $liteLlmDisplayCommand = "$($liteLlmCommand.Display) --config `"$($proxyConfig.path)`" --host 127.0.0.1 --port $LiteLlmPort"
        $powerShellHost = Resolve-PowerShellHost
        Write-LiteLlmLaunchScript -Path $liteLlmLaunchScriptFile -Root $root -ExecutablePath $liteLlmCommand.FilePath -ConfigPath $proxyConfig.path -EnvFilePath $backendEnvFile -Port $LiteLlmPort
        $liteLlmLaunch = Start-ServiceProcess -Name 'LiteLLM' -WorkingDirectory $root -Port $LiteLlmPort -FilePath $powerShellHost -Arguments @('-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $liteLlmLaunchScriptFile) -DisplayCommand $liteLlmDisplayCommand -ShowConsole:$false -ProcessWindowStyle Normal -NoWait -PortTimeoutSeconds $LiteLlmStartupTimeoutSeconds
    } catch {
        Write-Status 'ERROR' $_.Exception.Message
        exit 1
    }
}

$backendLaunch = Start-ServiceProcess -Name "Backend" -WorkingDirectory (Join-Path $root "backend") -Port $BackendPort -Arguments @("run", "dev") -ShowConsole:$ShowConsole -HealthUrl "http://localhost:$BackendPort/health" -NoWait
$frontendArgs = @("run", "dev", "--", "--host", "--port", $FrontendPort)
$frontendLaunch = Start-ServiceProcess -Name "Frontend" -WorkingDirectory (Join-Path $root "frontend") -Port $FrontendPort -Arguments $frontendArgs -ShowConsole:$ShowConsole -HealthUrl "http://localhost:$FrontendPort/" -AllowSoftHealthFailure -NoWait

$liteLlm = if ($liteLlmLaunch) { Complete-ServiceStartup -LaunchResult $liteLlmLaunch } else { @{ PortPid = $null; LaunchPid = $null; Status = 'skipped' } }
$backend = Complete-ServiceStartup -LaunchResult $backendLaunch
$frontend = Complete-ServiceStartup -LaunchResult $frontendLaunch

if ($backend.Status -eq "started" -or $backend.Status -eq "existing") { $pidData.backend = @{ portPid = $backend.PortPid; launchPid = $backend.LaunchPid } }
if ($frontend.Status -eq "started" -or $frontend.Status -eq "existing") { $pidData.frontend = @{ portPid = $frontend.PortPid; launchPid = $frontend.LaunchPid } }
if ($liteLlm.Status -eq 'started' -or $liteLlm.Status -eq 'existing') { $pidData.litellm = @{ portPid = $liteLlm.PortPid; launchPid = $liteLlm.LaunchPid } }

if (($pidData.Keys | Measure-Object).Count -gt 0) {
    $pidData | ConvertTo-Json -Depth 3 | Set-Content -Path $pidFile -Encoding ASCII
    Write-Status "INFO" "Saved process info to $($pidFile | Split-Path -Leaf)."
}

if ($backend.Status -eq "failed" -or $frontend.Status -eq "failed" -or $liteLlm.Status -eq 'failed') {
    Write-Status "ERROR" "Startup routine finished with errors. LiteLLM: http://localhost:$LiteLlmPort | Backend: http://localhost:$BackendPort | Frontend: http://localhost:$FrontendPort"
    exit 1
}

Write-Status "OK" "Startup routine complete. LiteLLM: http://localhost:$LiteLlmPort | Backend: http://localhost:$BackendPort | Frontend: http://localhost:$FrontendPort"

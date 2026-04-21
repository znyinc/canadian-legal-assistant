param(
  [string]$SourcePath,
  [string]$SourceZipUrl,
  [string]$FormsPath = (Join-Path $PSScriptRoot '..\court-forms'),
  [string]$ApiUrl = 'http://localhost:3001/api/export/forms/catalog?refresh=1',
  [int]$ThresholdDays = 30,
  [switch]$FailOnStale,
  [switch]$Clean
)

$ErrorActionPreference = 'Stop'

function Ensure-Directory {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Clear-FormsDirectory {
  param([string]$Path)
  Get-ChildItem -Path $Path -File -Force | Remove-Item -Force
}

function Sync-FromDirectory {
  param([string]$From, [string]$To)
  Write-Host "[INFO] Syncing forms from directory: $From"
  robocopy $From $To *.* /XO /R:1 /W:1 /NFL /NDL /NJH /NJS /NC /NS | Out-Null
}

function Sync-FromZipUrl {
  param([string]$Url, [string]$To)
  $tempZip = Join-Path ([System.IO.Path]::GetTempPath()) "court-forms-$(Get-Date -Format 'yyyyMMddHHmmss').zip"
  $tempExtract = Join-Path ([System.IO.Path]::GetTempPath()) "court-forms-extract-$(Get-Date -Format 'yyyyMMddHHmmss')"
  Write-Host "[INFO] Downloading forms archive from: $Url"
  Invoke-WebRequest -Uri $Url -OutFile $tempZip
  Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force
  Sync-FromDirectory -From $tempExtract -To $To
  Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
  Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
}

function Get-NewestFileAgeDays {
  param([string]$Path)
  $files = Get-ChildItem -Path $Path -File -ErrorAction SilentlyContinue
  if (-not $files -or $files.Count -eq 0) {
    return $null
  }

  $newest = ($files | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime
  $age = (New-TimeSpan -Start $newest -End (Get-Date)).TotalDays
  return [math]::Floor([double]$age)
}

Ensure-Directory -Path $FormsPath

if ($Clean) {
  Write-Host "[INFO] Clearing existing files in $FormsPath"
  Clear-FormsDirectory -Path $FormsPath
}

if ($SourcePath) {
  if (-not (Test-Path $SourcePath)) {
    throw "SourcePath does not exist: $SourcePath"
  }
  Sync-FromDirectory -From $SourcePath -To $FormsPath
} elseif ($SourceZipUrl) {
  Sync-FromZipUrl -Url $SourceZipUrl -To $FormsPath
} else {
  Write-Host "[INFO] No external source provided. Refreshing catalog for existing local files only."
}

$ageDays = Get-NewestFileAgeDays -Path $FormsPath
if ($null -eq $ageDays) {
  Write-Warning "[WARN] No files found in $FormsPath."
} else {
  Write-Host "[INFO] Newest form age: $ageDays day(s); threshold: $ThresholdDays day(s)."
}

if ($null -ne $ageDays -and $ageDays -gt $ThresholdDays) {
  Write-Warning "[WARN] Court forms are stale (newest file age exceeds threshold)."

  if ($SourcePath -or $SourceZipUrl) {
    Write-Host "[INFO] Refresh source provided; proceeding with update sync before final catalog refresh."
    if ($SourcePath) {
      Sync-FromDirectory -From $SourcePath -To $FormsPath
    } elseif ($SourceZipUrl) {
      Sync-FromZipUrl -Url $SourceZipUrl -To $FormsPath
    }
  } elseif ($FailOnStale) {
    throw "Court forms freshness check failed: age $ageDays > threshold $ThresholdDays and no update source was provided."
  } else {
    Write-Warning "[WARN] No update source provided. Continuing, but forms remain stale."
  }
}

Write-Host "[INFO] Refreshing backend court-forms catalog via $ApiUrl"
$catalog = Invoke-RestMethod -Uri $ApiUrl

$snapshotPath = Join-Path $FormsPath 'catalog.snapshot.json'
$catalog | ConvertTo-Json -Depth 6 | Set-Content -Path $snapshotPath -Encoding UTF8

Write-Host "[OK] Court forms refreshed."
Write-Host "[OK] Root path: $($catalog.rootPath)"
Write-Host "[OK] Total files: $($catalog.totalFiles)"
Write-Host "[OK] Snapshot written: $snapshotPath"
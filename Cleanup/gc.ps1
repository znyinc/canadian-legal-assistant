# Self-preserving Git cleanup script with stash, dry-run, and safe relocation

# Detect current script path and name
$scriptPath = $MyInvocation.MyCommand.Path
$scriptName = Split-Path $scriptPath -Leaf

# Define temp location outside repo
$tempDir = "$env:TEMP\GitCleanupBackup"
$tempPath = Join-Path $tempDir $scriptName

# Ensure temp directory exists
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Step 1: Move script out of repo
Move-Item -Path $scriptPath -Destination $tempPath -Force

# Step 2: Stash tracked changes
Write-Host "`n🔒 Stashing tracked changes..."
git stash push -m "Pre-clean stash"

# Step 3: Preview untracked files
Write-Host "`n🧹 Dry run preview of untracked files and directories:"
git clean -fdn

# Step 4: Confirm cleanup
Write-Host "`n⚠️ WARNING: The above files/folders will be permanently deleted."
$confirm = Read-Host "Proceed with 'git clean -fd'? (y/n)"

if ($confirm -eq "y") {
    Write-Host "`n✅ Cleaning untracked files and directories..."
    git clean -fd
} else {
    Write-Host "`n❌ Cleanup aborted. Untracked files remain."
}

# Step 5: Restore script
Move-Item -Path $tempPath -Destination $scriptPath -Force
Write-Host "`n🛡️ Script restored successfully."

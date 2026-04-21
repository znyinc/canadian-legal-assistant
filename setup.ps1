# ctx-builder setup — Windows PowerShell
# REQUIRES: Settings → Privacy & Security → Developer Mode ON
$ErrorActionPreference="Stop"; $base=(Get-Location).Path
@(".context/core",".context/domain",".context/session",".context/pinned",".kiro/steering/always",".kiro/steering/session",".cursor/rules",".github",".vscode")|ForEach-Object{New-Item -ItemType Directory -Force -Path $_|Out-Null}
New-Item -ItemType SymbolicLink -Force -Path ".kiro/steering/always/principles.md"  -Target "$base\.context\core\principles.ctx.md"
New-Item -ItemType SymbolicLink -Force -Path ".kiro/steering/always/tech-stack.md"  -Target "$base\.context\core\tech-stack.ctx.md"
New-Item -ItemType SymbolicLink -Force -Path ".kiro/steering/always/constraints.md" -Target "$base\.context\core\constraints.ctx.md"
New-Item -ItemType SymbolicLink -Force -Path ".kiro/steering/always/learnings.md"   -Target "$base\.context\pinned\learnings.ctx.md"
New-Item -ItemType SymbolicLink -Force -Path ".kiro/steering/session/active-goal.md"-Target "$base\.context\session\active-goal.ctx.md"
New-Item -ItemType SymbolicLink -Force -Path ".cursor/rules/principles.mdc"         -Target "$base\.context\core\principles.ctx.md"
New-Item -ItemType SymbolicLink -Force -Path ".cursor/rules/constraints.mdc"        -Target "$base\.context\core\constraints.ctx.md"
New-Item -ItemType SymbolicLink -Force -Path ".cursor/rules/learnings.mdc"          -Target "$base\.context\pinned\learnings.ctx.md"
New-Item -ItemType SymbolicLink -Force -Path ".cursor/rules/active-goal.mdc"        -Target "$base\.context\session\active-goal.ctx.md"
python build-copilot-context.py
Write-Host "Done!" -ForegroundColor Green
if (-not $env:SUPERMEMORY_API_KEY) {
  Write-Host ""
  Write-Host "  Tip: set SUPERMEMORY_API_KEY to auto-sync commit learnings to Supermemory" -ForegroundColor Cyan
  Write-Host "  [System.Environment]::SetEnvironmentVariable('SUPERMEMORY_API_KEY','sm_...','User')" -ForegroundColor DarkGray
}
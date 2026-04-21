#!/bin/bash
set -e
mkdir -p .context/core .context/domain .context/session .context/pinned
mkdir -p .kiro/steering/always .kiro/steering/session .cursor/rules .github .vscode .git/hooks
ln -sf "$(pwd)/.context/core/principles.ctx.md"      .kiro/steering/always/principles.md
ln -sf "$(pwd)/.context/core/tech-stack.ctx.md"      .kiro/steering/always/tech-stack.md
ln -sf "$(pwd)/.context/core/constraints.ctx.md"     .kiro/steering/always/constraints.md
ln -sf "$(pwd)/.context/domain/legal.ctx.md"                               .kiro/steering/always/domain.md
ln -sf "$(pwd)/.context/pinned/learnings.ctx.md"     .kiro/steering/always/learnings.md
ln -sf "$(pwd)/.context/session/active-goal.ctx.md"  .kiro/steering/session/active-goal.md
ln -sf "$(pwd)/.context/core/principles.ctx.md"      .cursor/rules/principles.mdc
ln -sf "$(pwd)/.context/core/constraints.ctx.md"     .cursor/rules/constraints.mdc
ln -sf "$(pwd)/.context/pinned/learnings.ctx.md"     .cursor/rules/learnings.mdc
ln -sf "$(pwd)/.context/session/active-goal.ctx.md"  .cursor/rules/active-goal.mdc
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/post-commit
python3 build-copilot-context.py
echo "✅ Done. Open project in VS Code."
echo ""
if [ -z "$SUPERMEMORY_API_KEY" ]; then
  echo "  💡 Tip: set SUPERMEMORY_API_KEY to auto-sync commit learnings to Supermemory"
  echo "  export SUPERMEMORY_API_KEY=sm_... (add to ~/.zshrc or ~/.bashrc)"
fi
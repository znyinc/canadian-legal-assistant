#!/usr/bin/env python3
"""build-copilot-context.py
Concatenates .context/ → .github/copilot-instructions.md
Called by: .vscode/tasks.json · .git/hooks/pre-commit · absorb-learnings.py
"""
import os
from datetime import date

SOURCES=[".context/core/principles.ctx.md",".context/core/tech-stack.ctx.md",".context/core/constraints.ctx.md",".context/domain/legal.ctx.md",".context/session/active-goal.ctx.md",".context/session/decisions-log.ctx.md",".context/pinned/learnings.ctx.md"]
def strip_fm(txt):
    if txt.startswith("---"):
        end=txt.index("---",3)
        return txt[end+3:].lstrip()
    return txt

def build():
    os.makedirs(".github",exist_ok=True)
    header=f"# AI Coding Instructions\n<!-- Auto-generated {date.today()} — DO NOT EDIT -->\n\n"
    with open(".github/copilot-instructions.md","w") as out:
        out.write(header)
        for src in SOURCES:
            if not os.path.exists(src): print(f"  ! skipped: {src}"); continue
            out.write(strip_fm(open(src).read())+"\n\n---\n\n")
            print(f"  ✓ {src}")
    print("Built → .github/copilot-instructions.md")

if __name__=="__main__": build()
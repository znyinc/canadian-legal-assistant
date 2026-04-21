#!/usr/bin/env python3
"""capture-session.py — run at end of each dev session.
Prompts for what broke/fixed, writes a Claude.ai-ready prompt to .context/session/claude-prompt.txt
"""
import os,subprocess
from datetime import date

SESSION_DIR=".context/session"
PROMPT_TEMPLATE="""You are helping maintain a learnings log for a software project.
Below is a session correction log. Extract 3-5 reusable rules in EXACTLY the format shown.
Output ONLY the markdown block — no preamble, no explanation, no code fences.

FORMAT (one block per rule):
## {TODAY} — [short descriptive title]
- **Pattern**: what recurring situation or mistake this addresses
- **Root cause**: why it happens
- **Rule**: the exact instruction to give an AI coding assistant
- **Anti-pattern**: what the AI should never do in this situation

SESSION CORRECTIONS LOG:
{LOG}
"""

def git_summary():
    try:
        r=subprocess.run(["git","diff","--stat","HEAD"],capture_output=True,text=True,timeout=5)
        lines=[l for l in r.stdout.strip().split("\n") if l.strip()]
        return "\n".join(lines[:10]) if lines else "(no git changes)"
    except: return "(git not available)"

def bullets(q,ex):
    print(f"\n{q}");print(f"  e.g. {ex}");print("  Enter one per line. Empty line when done.")
    b=[]
    while True:
        l=input("  → ").strip()
        if not l: break
        b.append(f"- {l}" if not l.startswith("-") else l)
    return b

def main():
    os.makedirs(SESSION_DIR,exist_ok=True)
    print("\n=== ctx-builder: Session Capture ===")
    broke=bullets("1. What broke / went wrong / needed redirecting?","React inputs lost focus on every keystroke")
    fixed=bullets("2. What fixed it / what was the correct approach?","Moved component defs outside App function")
    redirects=bullets("3. Any prompts that went the wrong way first?","Tried inline styles before realising CSS vars were needed")
    log_lines=[]
    if broke:  log_lines+=["### What broke",*broke,""]
    if fixed:  log_lines+=["### What fixed it",*fixed,""]
    if redirects: log_lines+=["### Wrong turns",*redirects,""]
    log_lines+=[f"### Git diff summary",git_summary()]
    log=chr(10).join(log_lines)
    prompt=PROMPT_TEMPLATE.format(TODAY=date.today(),LOG=log)
    with open(f"{SESSION_DIR}/claude-prompt.txt","w") as f: f.write(prompt)
    with open(f"{SESSION_DIR}/pending-review.md","w") as f: f.write(f"# Review {date.today()}\n\n"+log)
    print(f"\n✓ {SESSION_DIR}/claude-prompt.txt")
    print("\nNEXT: copy claude-prompt.txt → paste into Claude.ai → copy response → paste into .context/session/pending-learnings.md → python absorb-learnings.py\n")

if __name__=="__main__": main()
#!/usr/bin/env python3
"""absorb-learnings.py — run after pasting Claude's response into pending-learnings.md.
Routes corrections to the relevant skill's gotchas folder (Thariq pattern) or learnings.ctx.md.
"""
import os,sys
from datetime import date

PENDING=".context/session/pending-learnings.md"
LEARNINGS=".context/pinned/learnings.ctx.md"
MARKER="<!-- PASTE CLAUDE'S RESPONSE BELOW THIS LINE -->"

SKILLS={
    "1": (".claude/skills/commit-push-pr/gotchas/gotchas.md",  "commit-push-pr"),
    "2": (".claude/skills/verify-app/gotchas/gotchas.md",       "verify-app"),
    "3": (".claude/skills/review-changes/gotchas/gotchas.md",   "review-changes"),
    "4": (LEARNINGS,                                             "general learnings"),
}

def read(p): return open(p).read() if os.path.exists(p) else ""
def strip_fm(txt):
    if txt.startswith("---"):
        end=txt.index("---",3)
        return txt[end+3:].lstrip()
    return txt

def main():
    print("\n=== ctx-builder: Absorb Learnings ===")
    raw=read(PENDING)
    if not raw or MARKER not in raw:
        print("✗ pending-learnings.md is empty or missing the paste marker.");sys.exit(1)
    new_rules=raw.split(MARKER,1)[1].strip()
    if not new_rules:
        print("✗ No content below paste marker.");sys.exit(1)

    print("\nWhich skill does this correction relate to?")
    print("  1 — commit-push-pr  (git/commit workflow failures)")
    print("  2 — verify-app      (verification steps that were wrong or missing)")
    print("  3 — review-changes  (code review misses)")
    print("  4 — general learnings  (doesn't fit a skill)")
    choice=input("\n  → ").strip()
    target_path,skill_name=SKILLS.get(choice,(LEARNINGS,"general learnings"))

    os.makedirs(os.path.dirname(target_path),exist_ok=True)
    existing=read(target_path)

    if target_path==LEARNINGS:
        existing_body=strip_fm(existing)
        header=f"""---\nid: learnings\nscope: always\npriority: high\nrefreshCycle: pinned\nauto-updated: true\nlast-updated: {date.today()}\n---\n\n# Learned Rules\n\n<!-- Auto-updated by absorb-learnings.py. Newest entries at top. -->\n"""
        with open(target_path,"w") as out: out.write(header+new_rules+"\n\n"+existing_body)
    else:
        header=f"# Gotchas — {skill_name}\n\n<!-- Auto-updated by absorb-learnings.py. Newest entries at top. -->\n\n"
        if not existing or existing.startswith("#"):
            body=existing
        else:
            body=existing
        with open(target_path,"w") as out:
            out.write(header+f"## {date.today()}\n\n"+new_rules+"\n\n"+body.split("\n",5)[-1] if existing else header+f"## {date.today()}\n\n"+new_rules)

    print(f"\n✓ Written to: {target_path}  (skill: {skill_name})")

    placeholder=raw.split(MARKER)[0]+MARKER
    with open(PENDING,"w") as out: out.write(placeholder)
    print(f"✓ Cleared {PENDING}")

    if os.path.exists("build-copilot-context.py"):
        print("\n→ Rebuilding context files...");os.system("python build-copilot-context.py")
    print("\n✓ Done. Skill gotchas updated and context rebuilt.\n")

    lcount=len([l for l in read(LEARNINGS).split("\n") if l.startswith("## ")])
    if lcount>=20:
        print(f"  ⚠  learnings.ctx.md has {lcount} entries. Run python compress-learnings.py to compress.\n")

if __name__=="__main__": main()
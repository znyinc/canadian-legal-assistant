#!/usr/bin/env python3
"""session-hook.py — post-commit learning capture.
Runs after every git commit. Asks 3 questions (30s timeout, skippable).
Appends answers to .context/session/pending-learnings.md.
Set SUPERMEMORY_API_KEY env var to also push to Supermemory.
Never blocks commit — all errors are caught and logged to stderr."""
import os,sys,json,threading
from datetime import date

LEARNINGS=".context/session/pending-learnings.md"
SUPERMEMORY_URL="https://api.supermemory.ai/v3/memories"
TIMEOUT=30

def timed_input(prompt,timeout=TIMEOUT):
    result=[None]
    def _ask():
        try: result[0]=input(prompt)
        except (EOFError,KeyboardInterrupt): result[0]=""
    t=threading.Thread(target=_ask,daemon=True)
    t.start(); t.join(timeout)
    return result[0] if result[0] is not None else ""

def push_supermemory(key,content):
    try:
        import urllib.request
        data=json.dumps({"content":content,"tags":["ctx-builder","learnings"]}).encode()
        req=urllib.request.Request(SUPERMEMORY_URL,data=data,
            headers={"Authorization":f"Bearer {key}","Content-Type":"application/json"},
            method="POST")
        urllib.request.urlopen(req,timeout=10)
    except Exception as e:
        print(f"  [session-hook] Supermemory push failed (non-blocking): {e}",file=sys.stderr)

def main():
    try:
        print("\n=== ctx-builder: Post-commit learning capture ===")
        print("(30s per question — press Enter to skip, Ctrl-C to exit)\n")
        q1=timed_input("1. What did you just build / fix? → ").strip()
        if not q1: print("(skipped)\n"); return
        q2=timed_input("2. Anything that didn't work first try? → ").strip()
        q3=timed_input("3. A rule to remember next time? → ").strip()
        today=date.today().isoformat()
        entry=f"\n## {today} — post-commit\n- Built/fixed: {q1}\n"
        if q2: entry+=f"- Didn't work first try: {q2}\n"
        if q3: entry+=f"- Rule: {q3}\n"
        os.makedirs(os.path.dirname(LEARNINGS),exist_ok=True)
        with open(LEARNINGS,"a") as f: f.write(entry)
        print(f"\n✓ Appended to {LEARNINGS}")
        key=os.environ.get("SUPERMEMORY_API_KEY","")
        if key:
            push_supermemory(key,entry)
            print("✓ Pushed to Supermemory")
        else:
            print("\n  Tip: set SUPERMEMORY_API_KEY to auto-sync learnings to Supermemory")
            print("  export SUPERMEMORY_API_KEY=sm_...")
        print()
    except Exception as e:
        print(f"[session-hook] Error (non-blocking): {e}",file=sys.stderr)

if __name__=="__main__": main()
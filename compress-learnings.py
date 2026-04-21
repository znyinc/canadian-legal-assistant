#!/usr/bin/env python3
"""compress-learnings.py — deduplicate and prioritize learnings.ctx.md via Claude.
Run when absorb-learnings.py warns that entries exceed the threshold.
Requires: ANTHROPIC_API_KEY env var."""
import os,sys,json,re,urllib.request
from datetime import date

LEARNINGS=".context/pinned/learnings.ctx.md"
API_URL="https://api.anthropic.com/v1/messages"
THRESHOLD=20

def read(p): return open(p).read() if os.path.exists(p) else ""
def strip_fm(txt):
    if txt.startswith("---"):
        end=txt.index("---",3); return txt[end+3:].lstrip()
    return txt

def count_entries(txt): return len(re.findall(r"^##\s+",txt,re.MULTILINE))

def call_claude(key,prompt):
    data=json.dumps({"model":"claude-opus-4-6","max_tokens":4096,"messages":[{"role":"user","content":prompt}]}).encode()
    req=urllib.request.Request(API_URL,data=data,
        headers={"x-api-key":key,"anthropic-version":"2023-06-01","content-type":"application/json"},
        method="POST")
    resp=urllib.request.urlopen(req,timeout=60)
    return json.loads(resp.read())["content"][0]["text"]

def build_prompt(body,count):
    return f"""You are compressing a software project learnings log.\n\nLEARNINGS:\n{body}\n\nTASK:\n1. Deduplicate — merge entries about the same pattern into one rule.\n2. Prioritize — keep high-signal rules, remove vague or obvious ones.\n3. Rewrite — make each rule crisp and actionable for an AI coding assistant.\n4. Return the same markdown format (## heading per rule, bullet sub-points).\n\nReturn ONLY the markdown — no preamble, no fences.\nTarget: reduce to no more than {count//2} entries."""

def main():
    key=os.environ.get("ANTHROPIC_API_KEY","")
    if not key:
        print("✗ ANTHROPIC_API_KEY not set.\n  export ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)
    raw=read(LEARNINGS)
    if not raw: print(f"✗ {LEARNINGS} not found."); sys.exit(1)
    body=strip_fm(raw)
    count=count_entries(body)
    print(f"\n=== ctx-builder: Compress Learnings ===")
    print(f"Found {count} entries in {LEARNINGS}")
    if count<THRESHOLD:
        print(f"Only {count} entries — threshold is {THRESHOLD}. Nothing to compress."); return
    print(f"Compressing {count} entries via Claude API...")
    compressed=call_claude(key,build_prompt(body,count))
    header=f"---\nid: learnings\nscope: always\npriority: high\nrefreshCycle: pinned\nauto-updated: true\ncompressed: true\nlast-updated: {date.today()}\n---\n\n# Learned Rules\n\n<!-- Compressed by compress-learnings.py on {date.today()}. Original had {count} entries. -->\n\n"
    with open(LEARNINGS,"w") as f: f.write(header+compressed.strip()+"\n")
    new_count=count_entries(compressed)
    print(f"✓ Compressed {count} → {new_count} entries")
    print(f"✓ Written to {LEARNINGS}\n")
    if os.path.exists("build-copilot-context.py"):
        print("→ Rebuilding context files..."); os.system("python build-copilot-context.py")

if __name__=="__main__": main()
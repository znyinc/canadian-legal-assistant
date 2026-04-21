# Skill: skill-creator

## What this skill does
Scaffolds new skills for this project using Anthropic's proven skill patterns.
Type /skill-creator <name> to create a new skill folder.

## When to create a skill
Create a skill when you find yourself repeating the same instructions across sessions.
Good candidates: workflows you do multiple times a day, domain knowledge Claude gets wrong, project-specific procedures.

## Skill categories (from Thariq, Claude Code team)
- **Knowledge skills** — non-obvious facts, architecture decisions, domain rules
- **Workflow skills** — step-by-step procedures for repeated tasks
- **Environment skills** — describe tools, systems, infrastructure Claude operates in
- **Ops/automation skills** — DevOps workflows, scheduled tasks, multi-step pipelines

## How to build a good skill

### Structure every skill as a folder
```
.claude/skills/<name>/
  SKILL.md          ← entry point (loaded by Claude Code on invocation)
  gotchas/
    gotchas.md      ← failure patterns accumulated from real sessions
  references/
    api.md          ← detailed function signatures, examples (loaded on demand)
```

### Writing principles (Thariq's rules)
1. **Don't state the obvious** — Claude already knows how to code. Focus on what pushes it OUT of its default behaviour for your specific project.
2. **Build a Gotchas section** — The highest-signal content. Start empty, grow from real failures captured by absorb-learnings.py.
3. **Use progressive disclosure** — Point to other files for Claude to read at the right time. Don't dump everything in SKILL.md.
4. **One category per skill** — Skills that straddle Knowledge + Workflow + Environment are confusing. Split them.

## Template to create a new skill

When invoked, ask the user:
1. What is this skill for? (one sentence)
2. What category does it fit? (knowledge / workflow / environment / ops)
3. What are 2-3 non-obvious things Claude needs to know?
4. What has gone wrong in the past when doing this without the skill?

Then create the folder structure above with SKILL.md and an empty gotchas/gotchas.md.
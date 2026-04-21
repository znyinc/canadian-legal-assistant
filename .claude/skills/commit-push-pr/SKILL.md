# Skill: commit-push-pr

## What this skill does
Handles the full git commit → push → PR workflow. Boris Cherny runs this dozens of times daily.

## Steps
1. Run `git status` and `git diff --stat` to understand what changed
2. Stage all changes: `git add -A`
3. Write a concise commit message in conventional commits format (feat/fix/chore/docs/refactor)
4. Commit: `git commit -m "<message>"`
5. Push: `git push`
6. If push output includes a PR URL, print it

## Rules
- Never force push unless explicitly asked
- If unstaged changes look unrelated to the task, ask before staging
- Commit messages under 72 characters, imperative mood ("Add feature" not "Added feature")
- After committing, always report the commit hash

## Progressive disclosure
See gotchas/ for accumulated failure patterns from real sessions.
```
read gotchas/gotchas.md
```
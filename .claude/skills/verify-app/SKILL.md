# Skill: verify-app

## Why this exists
Boris Cherny's #1 tip: "Give Claude a way to verify its work — it will 2-3x the quality of the final result."
Run this after completing any task. Do not commit until verification passes.

## Verification steps for Node.js API

1. Run the test suite
2. Check for type errors or lint warnings
3. Start the app and verify the changed path
4. Check logs for unexpected errors

## If verification fails
- Do not proceed to commit
- Fix the failing test or error first
- Re-run verification until it passes
- Only then run /commit-push-pr

## Progressive disclosure
See gotchas/ for verification steps that were wrong or missed in past sessions.
```
read gotchas/gotchas.md
```
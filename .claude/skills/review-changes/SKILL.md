# Skill: review-changes

## What this skill does
Adversarial code review of everything in `git diff HEAD`. Run this before /commit-push-pr.
The goal: catch issues Claude introduced while implementing the task.

## Review checklist
- **Bugs**: logic errors, off-by-one, unhandled edge cases, race conditions
- **Security**: injection risks, unvalidated input, exposed secrets, auth gaps
- **Performance**: N+1 queries, unnecessary loops, blocking calls in async context
- **Regression risk**: changes that could break existing behaviour
- **Missing tests**: any new logic path with no test coverage

## Output format
List findings as: `[SEVERITY] file:line — description`
Severity: CRITICAL · HIGH · MEDIUM · LOW · SUGGESTION

If no issues found, say so explicitly. Do not invent issues.
After review, ask: "Should I fix any of these before committing?"

## Progressive disclosure
```
read gotchas/gotchas.md
```
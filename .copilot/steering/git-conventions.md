# Git Conventions

## Commit Message Format

### Structure
```
<type>: <brief description>

<detailed explanation (optional)>

🤖 Co-Authored-By: AI Assistant <ai@assistant.com>
```

### Types
```
feat:     New feature
fix:      Bug fix
refactor: Code restructuring (no behavior change)
test:     Add or update tests
docs:     Documentation changes
chore:    Build, dependencies, tooling
style:    Code formatting (no logic change)
perf:     Performance improvements
```

### Examples
```bash
# Feature
git commit -m "feat: add criminal domain module with 6 document templates

Implements CriminalDomainModule extending BaseDomainModule.
Generates victim services guide, evidence checklist, complainant role explanation.
Includes police/Crown process, release conditions, victim impact statement templates.

🤖 Co-Authored-By: AI Assistant <ai@assistant.com>"

# Bug fix
git commit -m "fix: correct backend port in E2E startup script from 3010 to 3001

E2E tests were failing with ECONNREFUSED because startup script waited
for backend on wrong port. Backend runs on 3001 per config.ts.

🤖 Co-Authored-By: AI Assistant <ai@assistant.com>"

# Refactor
git commit -m "refactor: extract cost calculation logic into CostCalculator class

Moves filing fee and fee waiver logic from ActionPlanGenerator to
dedicated CostCalculator component. No behavior changes.

🤖 Co-Authored-By: AI Assistant <ai@assistant.com>"

# Test
git commit -m "test: add E2E tests for action plan components

Validates acknowledgment banner, immediate actions, role explanation,
settlement pathways, warnings, and next steps rendering.

🤖 Co-Authored-By: AI Assistant <ai@assistant.com>"

# Documentation
git commit -m "docs: update AGENTS.md with Task 26.3 completion summary

Documents 5 decision-support kits implementation:
RentIncreaseKit, EmploymentTerminationKit, SmallClaimsPreparationKit,
MotorVehicleAccidentKit, WillChallengeKit.

🤖 Co-Authored-By: AI Assistant <ai@assistant.com>"
```

## Branch Naming

### Patterns
```bash
feature/<description>       # New features
fix/<description>          # Bug fixes
refactor/<description>     # Code improvements
test/<description>         # Test additions
chore/<description>        # Maintenance tasks
docs/<description>         # Documentation
```

### Examples
```bash
git checkout -b feature/legal-malpractice-domain
git checkout -b fix/pillar-classification-error
git checkout -b refactor/extract-cost-calculator
git checkout -b test/add-action-plan-e2e
git checkout -b chore/upgrade-multer-archiver
git checkout -b docs/update-userguide
```

## Workflow

### Feature Development
```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/my-feature

# Make changes and commit
git add src/core/MyFeature.ts tests/myFeature.test.ts
git commit -m "feat: add MyFeature component

Implements MyFeature with X, Y, Z capabilities.
Includes comprehensive test coverage.

🤖 Co-Authored-By: AI Assistant <ai@assistant.com>"

# Push to remote
git push -u origin feature/my-feature

# Create pull request (via GitHub CLI or web)
gh pr create --title "feat: Add MyFeature component" --body "Description..."
```

### Bug Fixes
```bash
# Create fix branch
git checkout -b fix/bug-description

# Fix and test
npm test                     # Verify fix
npm run build                # Ensure build succeeds

# Commit with clear description
git commit -m "fix: resolve issue with XYZ

Root cause was ABC. Fixed by DEF.
Added regression test to prevent recurrence.

🤖 Co-Authored-By: AI Assistant <ai@assistant.com>"
```

## Staging Changes

### Selective Staging (Preferred)
```bash
# ✅ Stage specific files only
git add src/core/MyFeature.ts
git add tests/myFeature.test.ts
git commit -m "feat: add MyFeature"

# ✅ Stage by patch (interactive)
git add -p src/core/MyFeature.ts

# ❌ NEVER stage everything blindly
git add .  # Dangerous - may include unintended files
```

### Pre-commit Checks
```bash
# Run before every commit
npm test                    # All tests passing
npm run build               # TypeScript compiles
npx playwright test         # E2E tests (if UI changes)

# Check for secrets
git diff --cached | grep -i "api_key\|password\|secret\|token"
```

## Pull Request Guidelines

### PR Title Format
```
<type>: <Brief description>

Examples:
feat: Add legal malpractice domain module
fix: Correct limitation period calculation for municipal cases
refactor: Extract action plan generator into separate component
test: Add E2E tests for matter creation flow
docs: Update USERGUIDE with form mapping system
```

### PR Description Template
```markdown
## Summary
- [Brief bullet points of main changes]

## Changes
- File 1: Description of changes
- File 2: Description of changes

## Testing
- [ ] Unit tests pass (npm test)
- [ ] E2E tests pass (npx playwright test)
- [ ] Manual testing completed

## Related Issues
Closes #123
Relates to #456
```

### PR Review Process
1. Create PR with clear title/description
2. Wait for CI checks (unit tests, E2E, Snyk scan)
3. Address review comments
4. Squash commits if needed
5. Merge when approved and CI green

## Commit Hygiene

### Atomic Commits
```bash
# ✅ Each commit should be one logical change
git commit -m "feat: add MatterClassifier"
git commit -m "test: add MatterClassifier tests"
git commit -m "docs: document MatterClassifier API"

# ❌ Avoid mixing unrelated changes
git commit -m "feat: add MatterClassifier and fix bug in DocumentPackager"
```

### Commit Frequency
- Commit after completing each logical unit of work
- Commit before switching tasks
- Commit before merging/rebasing
- Don't commit broken code to main/shared branches

### Amending Commits
```bash
# Fix typo in last commit message
git commit --amend -m "New message"

# Add forgotten file to last commit
git add forgotten-file.ts
git commit --amend --no-edit

# ⚠️ Only amend commits that haven't been pushed
# ⚠️ Never amend commits on main/master
```

## Dangerous Operations (Avoid)

### Force Push
```bash
# ❌ NEVER force push to main/master
git push --force origin main  # FORBIDDEN

# ⚠️ Only force push to your own feature branches (with caution)
git push --force origin feature/my-branch
```

### Rewriting History
```bash
# ❌ NEVER rebase/rewrite commits on main
# ❌ NEVER rebase commits that others depend on

# ✅ Rebasing your own unpushed commits is OK
git rebase -i HEAD~3  # Interactive rebase last 3 commits
```

## .gitignore Patterns
```bash
# Already configured, but reference:
node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
uploads/
backend/dev.db
backend/dev.db-journal
test-results/
playwright-report/
```

## Hooks (Optional)

### Pre-commit Hook
```bash
# .git/hooks/pre-commit (if needed)
#!/bin/sh
npm test
if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

### Commit Message Validation
```bash
# .git/hooks/commit-msg (if needed)
#!/bin/sh
commit_msg=$(cat "$1")
pattern="^(feat|fix|refactor|test|docs|chore|style|perf):"

if ! echo "$commit_msg" | grep -qE "$pattern"; then
  echo "Invalid commit message format."
  echo "Use: <type>: <description>"
  exit 1
fi
```

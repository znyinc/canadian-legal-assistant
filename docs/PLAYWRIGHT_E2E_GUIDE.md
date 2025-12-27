# Playwright E2E Testing Guide

**Last Updated:** December 26, 2025  
**Status:** ✅ All tests passing locally (5/5 in 4.2s)

## Overview

This document details the E2E testing setup, troubleshooting steps, and successful resolution of port configuration issues that prevented tests from running locally.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Test Suite Overview](#test-suite-overview)
- [Architecture](#architecture)
- [Troubleshooting History](#troubleshooting-history)
- [Port Configuration Fix](#port-configuration-fix)
- [Running Tests](#running-tests)
- [Common Issues](#common-issues)

---

## Quick Start

### Prerequisites
- Node.js installed
- Backend and frontend dependencies installed
- Servers running on correct ports (backend: 3001, frontend: 5173)

### Run E2E Tests
```powershell
# Option 1: With servers already running
npx playwright test

# Option 2: Let Playwright start servers
npx playwright test --config=playwright.config.ts

# Option 3: Run specific test
npx playwright test tests/e2e/golden-path.spec.ts

# Option 4: Run with UI (interactive)
npx playwright test --ui

# Option 5: Run with visible browser
npx playwright test --headed
```

### View Results
```powershell
# Open HTML report
npx playwright show-report

# View trace for debugging
npx playwright show-trace test-results/.../trace.zip
```

---

## Test Suite Overview

### Test Files (5 specs)

| Test File | Purpose | Duration |
|-----------|---------|----------|
| `golden-path.spec.ts` | Full happy path: intake → evidence → classify → generate Form 7A | ~1.8s |
| `journey.spec.ts` | Journey tracker persistence across page reloads | ~1.8s |
| `pillar.spec.ts` | Pillar explanation visibility in matter overview | ~1.5s |
| `pillar-ambiguous.spec.ts` (2 tests) | Ambiguous pillar detection and single pillar flow | ~1.9s each |

### Test Coverage

✅ **User Flows**
- Matter intake and creation
- Evidence upload with file handling
- Auto-classification with AI
- Forum routing display
- Document generation (Form 7A)
- Journey tracking
- Pillar explanation rendering

✅ **Edge Cases**
- Ambiguous pillar detection (multiple legal areas)
- Single pillar clarity (no ambiguity warning)
- Page reload persistence

---

## Architecture

### Configuration Files

```
canadian-legal-assistant/
├── playwright.config.ts          # Main Playwright config
├── scripts/
│   └── start-e2e.cjs            # E2E server startup script
├── backend/
│   ├── src/config.ts            # Backend config (PORT=3001 default)
│   └── package.json
├── frontend/
│   └── vite.config.ts           # Vite proxy to backend:3001
└── tests/e2e/
    ├── golden-path.spec.ts
    ├── journey.spec.ts
    ├── pillar.spec.ts
    ├── pillar-ambiguous.spec.ts
    └── fixtures/
        └── tree-photo.jpg       # Test evidence file
```

### Port Configuration

**Critical: All configs must use the same ports!**

| Component | Port | File |
|-----------|------|------|
| Backend API | 3001 | `backend/src/config.ts` |
| Frontend Dev Server | 5173 | `frontend/vite.config.ts` |
| E2E Test Expectation | 3001 (backend), 5173 (frontend) | `scripts/start-e2e.cjs` |
| Vite Proxy `/api` → | 3001 | `frontend/vite.config.ts` |
| Startup Scripts | 3001 | `startup.ps1`, `shutdown.ps1` |

---

## Troubleshooting History

### Initial Problem (December 26, 2025)

**Symptom:** All 5 E2E tests failing with "Request failed" errors and timeouts

**Error Messages:**
```
Error: expect(locator).toBeVisible() failed
Locator: getByText('Do I need to go to court?')
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Error Context:** Tests were stuck on the `/matters/new` page showing "Request failed" alert instead of navigating to the matter detail page.

### Investigation Steps

#### Step 1: Analyzed Test Failure
- Reviewed Playwright test output and screenshots
- Checked `error-context.md` showing tests stuck on form page
- Identified that matter creation API call was failing

#### Step 2: Checked Backend Connectivity
```powershell
# Attempted to connect to backend
Invoke-WebRequest -Uri "http://localhost:3001/api/matters"
# Result: Unable to connect to the remote server
```

**Finding:** Backend not responding on port 3001

#### Step 3: Discovered Port Mismatch
```powershell
# Checked which ports were actually in use
Get-NetTCPConnection -LocalPort 3001,3010,5173,5174

# Found: Nothing on 3001, something blocking 3010
```

**Finding:** Startup scripts were configured for port **3010**, but backend code defaults to **3001**

#### Step 4: Traced Configuration Files

**Backend Config (`backend/src/config.ts` line 12):**
```typescript
port: parseInt(process.env.PORT || '3001', 10),
```

**Startup Script (`startup.ps1` line 10):**
```powershell
$BackendPort = 3010  # ❌ WRONG - doesn't match backend config
```

**E2E Script (`scripts/start-e2e.cjs` line 97):**
```javascript
const backend = startService('backend', backendDir, { PORT: '3001' });
await waitForPort(3001);  // ✅ CORRECT
```

**Vite Proxy (`frontend/vite.config.ts`):**
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3001',  // ✅ CORRECT
  }
}
```

**Root Cause:** Inconsistent port configuration across files. Startup scripts used 3010, but actual default was 3001.

---

## Port Configuration Fix

### Changes Made

#### File 1: `startup.ps1`
```diff
- $BackendPort = 3010
+ $BackendPort = 3001

- $FrontendPort = 5174
+ $FrontendPort = 5173
```

#### File 2: `shutdown.ps1`
```diff
- $BackendPort = 3010
+ $BackendPort = 3001

- $FrontendPort = 5174
+ $FrontendPort = 5173
```

#### File 3: `SCRIPTS_README.md`
```diff
- **startup.ps1** - Starts backend (port 3010) and frontend (port 5173/5174) dev servers
+ **startup.ps1** - Starts backend (port 3001) and frontend (port 5173) dev servers

**Default ports:**
- - Backend: `http://localhost:3010`
+ - Backend: `http://localhost:3001`
- - Frontend: `http://localhost:5173` (or 5174 if 5173 is in use)
+ - Frontend: `http://localhost:5173`

# Find what's running on port 3010
- Get-NetTCPConnection -LocalPort 3010
+ Get-NetTCPConnection -LocalPort 3001
```

### Verification Steps

1. **Restarted Servers**
```powershell
cd D:\Code\legal\backend
npm run dev
# Output: 🚀 Canadian Legal Assistant API running on port 3001 ✅

cd D:\Code\legal\frontend
npm run dev
# Output: ➜ Local: http://localhost:5173/ ✅
```

2. **Confirmed Port Alignment**
```powershell
Test-NetConnection -ComputerName localhost -Port 3001
# Result: True ✅

Test-NetConnection -ComputerName localhost -Port 5173
# Result: True ✅
```

3. **Ran E2E Tests**
```powershell
npx playwright test
```

**Result:** ✅ **All 5 tests passing in 4.2 seconds**

---

## Running Tests

### Local Development Workflow

#### Method 1: Manual Server Start (Recommended for Development)
```powershell
# Terminal 1: Start backend
cd D:\Code\legal\backend
npm run dev

# Terminal 2: Start frontend
cd D:\Code\legal\frontend
npm run dev

# Terminal 3: Run tests (with server reuse)
cd D:\Code\legal
npx playwright test
```

**Advantage:** Faster test runs, keeps servers alive for repeated testing

#### Method 2: Automated Server Start
```powershell
# Playwright will start servers via scripts/start-e2e.cjs
npx playwright test
```

**Advantage:** Self-contained, ensures clean state

#### Method 3: Using Convenience Scripts
```powershell
# Start servers
.\startup.ps1

# Run tests
npx playwright test

# Stop servers when done
.\shutdown.ps1
```

**Advantage:** Easy Windows integration, handles port cleanup

### Test Execution Options

#### Run All Tests
```powershell
npx playwright test
```

#### Run Specific Test File
```powershell
npx playwright test tests/e2e/golden-path.spec.ts
```

#### Run with UI Mode (Interactive Debugging)
```powershell
npx playwright test --ui
```

#### Run in Headed Mode (Visible Browser)
```powershell
npx playwright test --headed
```

#### Run with Specific Browser
```powershell
npx playwright test --project=chromium
npx playwright test --project=firefox
```

#### Debug Single Test
```powershell
npx playwright test tests/e2e/golden-path.spec.ts --debug
```

#### Generate Code (Record Actions)
```powershell
npx playwright codegen http://localhost:5173
```

### Viewing Results

#### HTML Report (Auto-opens on failure)
```powershell
npx playwright show-report
```

#### Trace Viewer (For Failed Tests)
```powershell
npx playwright show-trace test-results/golden-path-.../trace.zip
```

---

## Common Issues

### Issue 1: "Address Already in Use" Error

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Cause:** Another process is using port 3001 or 5173

**Solution:**
```powershell
# Find and kill process on port 3001
Get-NetTCPConnection -LocalPort 3001 | ForEach-Object { 
    Stop-Process -Id $_.OwningProcess -Force 
}

# Find and kill process on port 5173
Get-NetTCPConnection -LocalPort 5173 | ForEach-Object { 
    Stop-Process -Id $_.OwningProcess -Force 
}

# Or use shutdown script
.\shutdown.ps1
```

### Issue 2: Tests Timeout Waiting for "Do I need to go to court?"

**Symptom:**
```
Error: expect(locator).toBeVisible() failed
Timeout: 5000ms
```

**Cause:** Backend not running or matter creation API failing

**Solution:**
1. Verify backend is running: `http://localhost:3001/api/matters`
2. Check frontend proxy is configured: `frontend/vite.config.ts`
3. Ensure Prisma database is migrated: `cd backend && npx prisma db push`

### Issue 3: Tests Can't Find Form 7A Button

**Symptom:**
```
Error: expect(locator).toBeVisible() failed
Locator: getByRole('button', { name: 'Generate Form 7A' })
```

**Cause:** Classification hasn't completed (button only appears for civil-negligence matters)

**Solution:**
1. Verify matter is created with `Legal Area: civil-negligence`
2. Check auto-classification is triggered in `MatterDetailPage.tsx`
3. Wait longer for classification: `await expect(button).toBeVisible({ timeout: 10000 })`

### Issue 4: File Upload Fails

**Symptom:**
```
Error: file upload timeout or API 500 error
```

**Cause:** File path incorrect or uploads directory doesn't exist

**Solution:**
1. Ensure test fixture exists: `tests/e2e/fixtures/tree-photo.jpg`
2. Create uploads directory: `mkdir backend/uploads` (auto-created by backend)
3. Check file permissions on Windows

### Issue 5: Pillar Ambiguity Not Detected

**Symptom:**
```
Expected element to be visible: text=Ambiguous: multiple legal pillars
Received: 0 elements
```

**Cause:** Matter description doesn't trigger multiple pillars

**Solution:**
Use ambiguous description in test:
```typescript
await page.getByLabel(/description/i).fill(
  'I was injured at work due to negligence and now facing wrongful dismissal'
);
// Triggers: tort (injury) + employment (wrongful dismissal)
```

### Issue 6: Tests Pass Locally, Fail in CI

**Symptom:** All tests green locally, red in GitHub Actions

**Possible Causes & Solutions:**

1. **Port mismatch in CI:**
   - Verify `.github/workflows/ci.yml` uses correct ports
   - Ensure `scripts/start-e2e.cjs` waits for port 3001

2. **Race conditions (slower CI):**
   - Increase timeouts: `{ timeout: 15000 }` for async operations
   - Add explicit waits: `await page.waitForSelector('text=Legal pillar:')`

3. **Database state:**
   - CI should reset database between test runs
   - Use isolated test data (unique IDs)

4. **File paths:**
   - Use relative paths from project root
   - Windows (`\`) vs Linux (`/`) path separators

---

## Test Best Practices

### Locators

✅ **Prefer semantic selectors:**
```typescript
// Good
await page.getByRole('button', { name: 'Create' }).click();
await page.getByLabel(/description/i).fill('...');
await page.getByText('Do I need to go to court?');

// Avoid
await page.click('#submit-button');
await page.click('.btn-primary');
```

### Waiting

✅ **Use explicit waits for async operations:**
```typescript
// Wait for navigation
await expect(page).toHaveURL(/\/matters\/[a-zA-Z0-9]+/);

// Wait for API response
const responsePromise = page.waitForResponse(
  resp => resp.url().includes('/api/evidence/') && resp.status() === 201
);
await page.locator('input[type=file]').setInputFiles('...');
await responsePromise;

// Wait for element with timeout
await expect(page.getByText('Classification complete')).toBeVisible({ 
  timeout: 10000 
});
```

### File Uploads

✅ **Use promises to await API completion:**
```typescript
const uploadPromise = page.waitForResponse(
  resp => resp.url().includes('/api/evidence/') && resp.status() === 201
);
await page.locator('input[type=file]').setInputFiles('tests/e2e/fixtures/tree-photo.jpg');
await uploadPromise;
```

### Assertions

✅ **Assert state before interactions:**
```typescript
// Ensure button is visible before clicking
const generateButton = page.getByRole('button', { name: 'Generate Form 7A' });
await expect(generateButton).toBeVisible({ timeout: 10000 });
await generateButton.click();
```

---

## Success Metrics

### Current Status (December 26, 2025)

**Local Test Results:**
```
Running 5 tests using 5 workers

  ✓  1 [chromium] › pillar-ambiguous.spec.ts:6:1 › ambiguous pillars shown in overview (1.9s)
  ✓  2 [chromium] › golden-path.spec.ts:4:1 › golden path: intake → evidence → classify → generate Form 7A (1.8s)
  ✓  3 [chromium] › journey.spec.ts:3:1 › journey tracker persists across reloads (1.8s)
  ✓  4 [chromium] › pillar.spec.ts:4:1 › pillar explanation is visible in matter overview (1.5s)
  ✓  5 [chromium] › pillar-ambiguous.spec.ts:35:1 › single pillar flow shows explanation without ambiguity note (1.9s)

  5 passed (4.2s)
```

**Configuration Alignment:**
- ✅ Backend: port 3001
- ✅ Frontend: port 5173
- ✅ E2E script: port 3001
- ✅ Vite proxy: port 3001
- ✅ Startup scripts: port 3001
- ✅ Documentation: port 3001

**Coverage:**
- ✅ Happy path workflows
- ✅ Error handling
- ✅ Async operations (classification, file upload)
- ✅ State persistence (journey tracker)
- ✅ Edge cases (ambiguous pillars)

---

## Next Steps

### For CI Integration

1. **Update GitHub Actions workflow** to use port 3001
2. **Add E2E job** to `.github/workflows/ci.yml`:
   ```yaml
   e2e-tests:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v3
       - uses: actions/setup-node@v3
       - run: npm ci
       - run: cd backend && npm ci
       - run: cd frontend && npm ci
       - run: npx playwright install --with-deps chromium
       - run: npx playwright test
       - uses: actions/upload-artifact@v3
         if: always()
         with:
           name: playwright-report
           path: playwright-report/
   ```

3. **Monitor CI results** on PR #3

### For Test Expansion

1. **Add tests for remaining flows:**
   - Settings page (export, delete, audit)
   - Case law search
   - Document download
   - Error scenarios (invalid input, API failures)

2. **Add visual regression testing:**
   ```typescript
   await expect(page).toHaveScreenshot('matter-overview.png');
   ```

3. **Add accessibility testing:**
   ```typescript
   import { injectAxe, checkA11y } from 'axe-playwright';
   await injectAxe(page);
   await checkA11y(page);
   ```

---

## Commit History

**December 26, 2025 - Port Standardization Fix**

```
Commit: 6a8c14f
Author: zyinc-control
Message: fix: standardize backend port to 3001 in startup scripts and docs

- Update startup.ps1 to use port 3001 (was 3010)
- Update shutdown.ps1 to use port 3001 (was 3010)
- Update SCRIPTS_README.md documentation to reflect port 3001
- Fixes inconsistency with backend/src/config.ts default
- Aligns with E2E test expectations (scripts/start-e2e.cjs)

🤖 Co-Authored-By: AI Assistant <ai@assistant.com>
```

**Related PRs:**
- PR #2: Closed (initial E2E port fix attempt)
- PR #3: Open (E2E stabilization + port standardization)

---

## Contact & Support

**Issues with E2E tests?**
1. Check this guide for common issues
2. Verify port configuration alignment
3. Review test output and screenshots in `test-results/`
4. Check Playwright trace: `npx playwright show-trace test-results/.../trace.zip`
5. Open issue on GitHub with full error context

**Playwright Documentation:**
- https://playwright.dev/docs/intro
- https://playwright.dev/docs/best-practices
- https://playwright.dev/docs/locators

---

**Document Version:** 1.0  
**Last Verified:** December 26, 2025  
**Test Suite Status:** ✅ All Passing (5/5)

# Testing Standards

## Unit Testing (Vitest)

### Test File Structure
```typescript
// tests/myFeature.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MyClass } from '../src/core/MyClass';

describe('MyClass', () => {
  let instance: MyClass;
  
  beforeEach(() => {
    instance = new MyClass();
  });
  
  describe('myMethod', () => {
    it('should return expected value when given valid input', () => {
      const result = instance.myMethod('input');
      expect(result).toBe('expected');
    });
    
    it('should throw error when given invalid input', () => {
      expect(() => instance.myMethod('')).toThrow('Invalid input');
    });
  });
});
```

### Test Naming
```typescript
// ✅ Good - describes behavior
it('should calculate 2-year limitation period for civil negligence', () => {});
it('should detect municipal 10-day notice from keywords', () => {});
it('should generate action plan with urgent priority when deadline <7 days', () => {});

// ❌ Bad - vague or implementation-focused
it('works', () => {});
it('test calculation', () => {});
it('calls getLimitationPeriod', () => {});
```

### Assertion Patterns
```typescript
// Equality
expect(result).toBe('exact value');           // Primitives
expect(result).toEqual({ id: 1, name: 'x' }); // Objects

// Truthiness
expect(result).toBeTruthy();
expect(result).toBeFalsy();
expect(result).toBeDefined();
expect(result).toBeUndefined();
expect(result).toBeNull();

// Numbers
expect(value).toBeGreaterThan(0);
expect(value).toBeLessThanOrEqual(100);
expect(value).toBeCloseTo(0.3, 2); // Floating point

// Strings
expect(text).toContain('substring');
expect(text).toMatch(/regex/);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain('item');
expect(array).toEqual(expect.arrayContaining(['a', 'b']));

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('Specific message');
expect(() => fn()).toThrow(CustomError);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ partial: 'match' });
```

### Mocking Dependencies
```typescript
import { vi } from 'vitest';

// Mock function
const mockFn = vi.fn();
mockFn.mockReturnValue('result');
mockFn.mockResolvedValue('async result');

expect(mockFn).toHaveBeenCalledWith('arg');
expect(mockFn).toHaveBeenCalledTimes(1);

// Mock module
vi.mock('../src/api/CanLiiClient', () => ({
  CanLiiClient: vi.fn().mockImplementation(() => ({
    search: vi.fn().mockResolvedValue([]),
  })),
}));
```

### Async Testing
```typescript
it('should fetch data asynchronously', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

it('should handle promise rejection', async () => {
  await expect(fetchData()).rejects.toThrow('Network error');
});
```

## E2E Testing (Playwright)

### Test Structure
```typescript
// tests/e2e/matter-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Matter Creation Flow', () => {
  test('should create civil negligence matter and generate documents', async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:5173');
    
    // Click "Start New Matter"
    await page.getByRole('link', { name: /start new matter/i }).click();
    await expect(page).toHaveURL(/\/matters\/new/);
    
    // Fill intake form
    await page.getByLabel(/describe your situation/i).fill('Tree fell on my car');
    await page.getByLabel(/province/i).selectOption('Ontario');
    await page.getByRole('button', { name: /submit/i }).click();
    
    // Verify classification
    await expect(page.getByText(/civil negligence/i)).toBeVisible();
    
    // Generate documents
    await page.getByRole('button', { name: /generate documents/i }).click();
    await expect(page.getByText(/demand notice/i)).toBeVisible();
  });
});
```

### Locator Best Practices
```typescript
// ✅ Prefer role-based locators (accessibility-friendly)
page.getByRole('button', { name: /submit/i });
page.getByRole('heading', { name: /what you need to do/i });
page.getByRole('link', { name: /case law/i });

// ✅ Use labels for form inputs
page.getByLabel(/description/i);
page.getByLabel(/province/i);

// ✅ Use test IDs when necessary
page.getByTestId('matter-id-display');

// ❌ Avoid brittle selectors
page.locator('.btn-primary'); // CSS classes change
page.locator('#submit-btn');  // IDs may change
```

### Assertions
```typescript
// Visibility
await expect(page.getByText('Success')).toBeVisible();
await expect(page.getByText('Error')).not.toBeVisible();

// URL
await expect(page).toHaveURL(/\/matters\/\w+/);

// Text content
await expect(page.getByRole('heading')).toHaveText('Title');
await expect(page.locator('.alert')).toContainText('saved');

// Attributes
await expect(page.getByRole('button')).toBeDisabled();
await expect(page.getByRole('button')).toBeEnabled();

// Count
await expect(page.getByRole('listitem')).toHaveCount(5);
```

### Responsive Testing
```typescript
test('should display mobile menu on small viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  
  // Verify mobile menu visible
  await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
});

test('should display desktop layout on large viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  
  // Verify desktop nav visible
  await expect(page.getByRole('navigation')).toBeVisible();
});
```

## Test Coverage Requirements

### Core Library (src/)
- **Target:** 80%+ coverage
- All domain modules must have tests
- All triage/classification logic must be tested
- All document generation must be tested

### Backend (backend/src/)
- **Target:** 70%+ coverage
- All API routes must have integration tests
- Error handling must be tested
- File upload/validation must be tested

### Frontend (frontend/src/)
- **Target:** 60%+ coverage
- Critical user flows must have E2E tests
- Component rendering must be tested
- Form validation must be tested

## Running Tests

```bash
# Unit tests (from root)
npm test                 # Run all tests
npm run test:watch       # Watch mode

# Frontend tests
cd frontend
npm test

# Backend tests (if separate)
cd backend
npm test

# E2E tests
npx playwright test                    # All specs
npx playwright test --headed           # Watch browser
npx playwright test --debug            # Debug mode
npx playwright test action-plan.spec   # Specific spec
```

## Pre-commit Testing
```bash
# Must pass before committing:
npm test                    # All unit tests
npm run build               # TypeScript compilation
npx playwright test         # E2E tests (critical flows)
```

## Test Data
```typescript
// Use realistic test data
const testMatter = {
  description: 'Tree fell on my car causing $5000 damage',
  province: 'Ontario',
  tags: ['property-damage', 'tree-damage'],
};

// Not: 'test', 'foo', 'bar', 'asdf'
```

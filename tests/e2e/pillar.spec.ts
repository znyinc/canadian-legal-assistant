import { test, expect } from '@playwright/test';

// Verifies pillar and explanation appear on Matter Overview after classification
test('pillar explanation is visible in matter overview', async ({ page }) => {
  // Navigate directly to new matter page
  await page.goto('/matters/new');
  // Use label-based locators (more resilient and accessible)
  await expect(page.getByLabel(/description/i)).toBeVisible({ timeout: 10000 });
  await page.getByLabel(/description/i).fill('Slip and fall negligence at a supermarket causing injury');
  await page.getByLabel(/province/i).selectOption('Ontario');
  await page.getByLabel(/legal area/i).selectOption('civil-negligence');
  await page.getByRole('button', { name: /create/i }).click();

  // Wait for the quick answer then the pillar header (classification may be async/backed by an external process)
  await expect(page.getByText('Do I need to go to court?')).toBeVisible({ timeout: 10000 });
  const pillarHeader = page.getByText('Legal pillar:');
  await expect(pillarHeader).toBeVisible({ timeout: 15000 });

  // Assert burden of proof and overview content with auto-retry
  await expect(page.getByText('Burden of proof:')).toBeVisible();
  await expect(page.getByText('Balance of probabilities').first()).toBeVisible();
  // Check a stable substring from the overview rather than the full sentence
  await expect(page.getByText(/civil matters/i)).toBeVisible();
});
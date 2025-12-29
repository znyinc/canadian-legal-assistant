import { test, expect } from '@playwright/test';

test('journey tracker persists across reloads', async ({ page }) => {
  // Create a new matter and rely on auto-classification
  await page.goto('/matters/new');

  await page.getByLabel(/description/i).fill('Slip and fall negligence at a supermarket — please help');
  await page.getByLabel(/province/i).selectOption('Ontario');
  await page.getByLabel(/Legal Area/i).selectOption('other');
  await page.getByRole('button', { name: /create/i }).click();

  // Wait for navigation to the matter and for journey tracker to appear
  await expect(page.getByText('Do I need to go to court?')).toBeVisible({ timeout: 10000 });
  const journeyHeader = page.getByText('Journey Tracker');
  await expect(journeyHeader).toBeVisible({ timeout: 10000 });

  // Check percent complete is shown
  const percent = page.getByText(/\d+% complete/);
  await expect(percent).toBeVisible({ timeout: 10000 });

  // Check a couple of stable step labels
  await expect(page.getByText('Understand', { exact: true })).toBeVisible();
  await expect(page.getByText('Options', { exact: true })).toBeVisible();

  // Reload and verify persistence
  await page.reload();
  await expect(page.getByText('Journey Tracker')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/\d+% complete/)).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Understand', { exact: true })).toBeVisible();
  await expect(page.getByText('Options', { exact: true })).toBeVisible();
});
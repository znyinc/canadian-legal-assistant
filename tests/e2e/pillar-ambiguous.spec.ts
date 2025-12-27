import { test, expect } from '@playwright/test';

test.describe.configure({ retries: 2, timeout: 60000 });

// Verifies ambiguous pillars are shown when multiple pillars are detected
test('ambiguous pillars shown in overview', async ({ page }) => {
  // Navigate directly to new matter page
  await page.goto('/matters/new');
  await page.waitForTimeout(500);

  // Wait for form to be visible
  await page.waitForSelector('textarea[name=description]', { timeout: 10000 });
  await page.fill('textarea[name=description]', 'I was assaulted and also received a parking ticket');
  await page.selectOption('select[name=province]', 'Ontario');
  await page.selectOption('select[name=domain]', 'other');
  await page.click('text=Create');

  // Wait for matter detail and classification
  await page.waitForSelector('text=Do I need to go to court?');

  // Ambiguous note should appear
  await page.waitForSelector('text=Ambiguous: multiple legal pillars detected', { timeout: 5000 });

  await expect(page.locator('text=Criminal, Quasi-Criminal')).toBeVisible();

  // Reload page to verify persistence of classification from server
  await page.reload();
  await page.waitForSelector('text=Ambiguous: multiple legal pillars detected', { timeout: 5000 });
  await expect(page.locator('text=Criminal, Quasi-Criminal')).toBeVisible();
});

// Verifies single-pillar flow still renders explanation without ambiguity
test('single pillar flow shows explanation without ambiguity note', async ({ page }) => {
  // Navigate directly to new matter page
  await page.goto('/matters/new');
  await page.waitForTimeout(500);

  // Wait for form to be visible
  await page.waitForSelector('textarea[name=description]', { timeout: 10000 });
  await page.fill('textarea[name=description]', 'Slip and fall negligence at a supermarket causing injury');
  await page.selectOption('select[name=province]', 'Ontario');
  // Choose explicit civil-negligence path to avoid ambiguous classification
  await page.getByLabel(/legal area/i).selectOption('civil-negligence');
  await page.click('text=Create');

  await page.waitForSelector('text=Legal pillar:', { timeout: 5000 });
  await expect(page.locator('text=Ambiguous: multiple legal pillars detected')).toHaveCount(0);
  await expect(page.getByText(/balance of probabilities/i)).toBeVisible();
});
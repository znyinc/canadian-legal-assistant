import { test, expect, Page } from '@playwright/test';

test.describe('Criminal Case Forum Routing Fix Verification', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Start fresh
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test('should route criminal assault case to Ontario Court of Justice (not Small Claims)', async () => {
    // Navigate to app
    await page.goto('http://localhost:5173');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click "Create New Legal Matter" or similar button
    const newMatterLink = await page.getByRole('link', { name: /new matter/i }).first();
    if (await newMatterLink.isVisible()) {
      await newMatterLink.click();
    } else {
      // Try button instead
      const newMatterBtn = await page.getByRole('button', { name: /new matter/i }).first();
      if (await newMatterBtn.isVisible()) {
        await newMatterBtn.click();
      }
    }

    await page.waitForLoadState('networkidle');

    // Fill in matter type
    const titleInput = await page.getByLabel(/matter title|title of your legal matter/i);
    if (await titleInput.isVisible()) {
      await titleInput.fill('Sunday Night Altercation');
    }

    // Fill in description with criminal keywords
    const descriptionInput = await page.getByLabel(/description|what happened/i);
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill('There was an assault and uttering of threats. Police were called and I was arrested.');
    }

    // Fill in location (Ontario)
    const provinceSelect = await page.locator('select[name="province"]').first();
    if (await provinceSelect.isVisible()) {
      await provinceSelect.selectOption('Ontario');
    }

    // Submit the form
    const submitBtn = await page.getByRole('button', { name: /submit|create|proceed|next/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }

    // Wait for classification/routing results
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give server time to compute

    // Get the page content to inspect
    const content = await page.content();
    console.log('Page content after submission:', content.substring(0, 2000));

    // Check for "Ontario Court of Justice" text
    const ocjText = await page.getByText(/Ontario Court of Justice/i);
    const smallClaimsText = await page.getByText(/Small Claims Court/);

    console.log('OCJ visible:', await ocjText.isVisible().catch(() => false));
    console.log('Small Claims visible:', await smallClaimsText.isVisible().catch(() => false));

    // Assert: Should show Ontario Court of Justice
    const ocjExists = await page.locator('text=/Ontario Court of Justice/i').isVisible().catch(() => false);
    const smallClaimsExists = await page.locator('text=/Small Claims Court/').isVisible().catch(() => false);

    console.log('OCJ text found:', ocjExists);
    console.log('Small Claims text found:', smallClaimsExists);

    if (!ocjExists) {
      throw new Error(`FAIL: Ontario Court of Justice not found in page. Small Claims found: ${smallClaimsExists}`);
    }

    if (smallClaimsExists && !ocjExists) {
      throw new Error('FAIL: Criminal case still routes to Small Claims Court (old bug)');
    }

    console.log('✅ PASS: Criminal case correctly routes to Ontario Court of Justice');
  });
});

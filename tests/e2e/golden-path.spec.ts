import { test, expect } from '@playwright/test';
import path from 'path';

test('golden path: intake -> evidence -> classify -> generate Form 7A', async ({ page }) => {
  // 1. Better Navigation
  await page.goto('/matters/new');

  // 2. Use Locators instead of Selectors for stability
  const description = page.getByLabel(/description/i);
  await expect(description).toBeVisible({ timeout: 10000 });
  await description.fill('A municipal tree fell on my parked car');
  
  await page.getByLabel(/province/i).selectOption('Ontario');
  await page.getByLabel(/Legal Area/i).selectOption('civil-negligence');
  await page.getByRole('button', { name: 'Create' }).click();

  // 3. Wait for URL with regex
  await expect(page).toHaveURL(/\/matters\/[a-zA-Z0-9]+/);

  // 4. Asserting visibility instead of try/catch debug block
  await expect(page.getByText('Do I need to go to court?')).toBeVisible();

  // 5. Direct file upload via locator
  // Navigate to Evidence tab first
  await page.getByRole('tab', { name: 'Evidence' }).click();
  
  // Use absolute path for file upload to be safe
  const fileUploadPromise = page.waitForResponse(resp => 
    resp.url().includes('/api/evidence/') && resp.status() === 201
  );
  
  await page.locator('input[type=file]').setInputFiles('tests/e2e/fixtures/tree-photo.jpg');
  await fileUploadPromise;

  // 6. Interaction with "Generate Form 7A" button
  // This button appears asynchronously after classification is complete.
  // It is located in the header, so it should be visible from the Evidence tab.
  const generateButton = page.getByRole('button', { name: 'Generate Form 7A' });
  await expect(generateButton).toBeVisible({ timeout: 10000 });
  await generateButton.click();
  
  // 7. Wait for navigation to documents tab
  await expect(page).toHaveURL(/\/matters\/[a-zA-Z0-9]+\/documents/);
  
  // 8. Verify document generation
  // The document list should contain the generated Form 7A
  await expect(page.getByText('Form 7A')).toBeVisible({ timeout: 10000 });
});

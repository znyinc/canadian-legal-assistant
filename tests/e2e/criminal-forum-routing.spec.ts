import { test, expect } from '@playwright/test';

test.describe('Criminal Forum Routing Fix', () => {
  test('criminal assault case routes to Ontario Court of Justice, NOT Small Claims Court', async ({ page }) => {
    // Navigate to matter creation form
    await page.goto('/matters/new');
    
    // Fill form: Criminal assault case
    const description = page.getByLabel(/description/i);
    await expect(description).toBeVisible({ timeout: 10000 });
    await description.fill('Sunday night altercation. I was assaulted outside my apartment. Uttering threats were made.');
    
    // Select Ontario
    await page.getByLabel(/province/i).selectOption('Ontario');
    
    // Submit form
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Wait for classification to render
    await expect(page.getByText('Do I need to go to court?')).toBeVisible({ timeout: 10000 });
    
    // Get the matter details page content
    const content = await page.textContent('body');
    
    // Verify the fix: Should say "Ontario Court of Justice" as primary forum
    expect(content).toContain('Primary forum: Ontario Court of Justice');
    
    // Verify it's a criminal case (check for criminal-specific guidance)
    expect(content).toContain('criminal charges');
    expect(content).toContain('Complainant');  // Criminal role explanation
  });

  test('civil negligence case (tree damage) still routes to Small Claims Court', async ({ page }) => {
    // Navigate to matter creation form
    await page.goto('/matters/new');
    
    // Fill form: Civil negligence case
    const description = page.getByLabel(/description/i);
    await expect(description).toBeVisible({ timeout: 10000 });
    await description.fill('My neighbor\'s tree fell on my property fence. They refuse to pay for repairs. Damage estimate is $3,500.');
    
    // Select Ontario
    await page.getByLabel(/province/i).selectOption('Ontario');
    
    // Select civil-negligence domain
    await page.getByLabel(/Legal Area/i).selectOption('civil-negligence');
    
    // Submit form
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Wait for classification to render
    await expect(page.getByText('Do I need to go to court?')).toBeVisible({ timeout: 10000 });
    
    // Get the matter details page content
    const content = await page.textContent('body');
    
    // Verify: Should say "Small Claims Court" for civil negligence under $50K
    expect(content).toContain('Small Claims Court');
  });
});

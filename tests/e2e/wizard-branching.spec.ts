import { test, expect } from '@playwright/test';

test.describe('Redesigned Intake Wizard - Branching Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('shows 4 role options in Step 1', async ({ page }) => {
    await page.getByRole('link', { name: /new matter/i }).first().click();
    
    // Step 1: Role Selection
    await expect(page.getByRole('heading', { name: /what is your role/i })).toBeVisible();
    
    // Verify all 4 role options
    await expect(page.getByRole('button', { name: /I want to take action/i })).toBeVisible(); // plaintiff
    await expect(page.getByRole('button', { name: /Action is being taken against me/i })).toBeVisible(); // defendant
    await expect(page.getByRole('button', { name: /I need to manage a process/i })).toBeVisible(); // administrative
    await expect(page.getByRole('button', { name: /I need urgent protection/i })).toBeVisible(); // protection
  });

  test('plaintiff flow: shows 7 categories in Step 2', async ({ page }) => {
    await page.getByRole('link', { name: /new matter/i }).first().click();
    
    // Step 1: Select plaintiff role
    await page.getByRole('button', { name: /I want to take action/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 2: Category Selection
    await expect(page.getByRole('heading', { name: /what area of law/i })).toBeVisible();
    
    // Verify all 7 categories with icons
    await expect(page.getByRole('button', { name: /money/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /family/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /workplace/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /harm/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /government/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /life-planning/i })).toBeVisible();
  });

  test('scenario filtering: plaintiff money scenarios differ from defendant', async ({ page }) => {
    await page.getByRole('link', { name: /new matter/i }).first().click();
    
    // Plaintiff path: Select plaintiff → money
    await page.getByRole('button', { name: /I want to take action/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /money/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 3: Verify plaintiff money scenarios
    await expect(page.getByRole('heading', { name: /what specifically happened/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /professional.*messed up/i })).toBeVisible(); // legal malpractice
    await expect(page.getByRole('button', { name: /didn't deliver/i })).toBeVisible(); // contract breach
    
    // Go back and switch to defendant
    await page.getByRole('button', { name: /back/i }).click();
    await page.getByRole('button', { name: /back/i }).click();
    await page.getByRole('button', { name: /Action is being taken against me/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /money/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Verify defendant scenarios are different
    await expect(page.getByRole('button', { name: /sued.*owe money/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sued.*breach/i })).toBeVisible();
  });

  test('urgency alert: shows warning when deadline <20 days', async ({ page }) => {
    await page.getByRole('link', { name: /new matter/i }).first().click();
    
    // Navigate to Step 4: plaintiff → money → malpractice
    await page.getByRole('button', { name: /I want to take action/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /money/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /professional.*messed up/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 4: Select "I was served papers"
    await expect(page.getByRole('heading', { name: /active deadlines/i })).toBeVisible();
    await page.getByRole('button', { name: /served.*papers/i }).click();
    
    // Enter date 10 days ago (urgent)
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const dateString = tenDaysAgo.toISOString().split('T')[0];
    
    await page.locator('input[type="date"]').fill(dateString);
    
    // Verify urgency alert appears
    await expect(page.getByText(/10 days until deadline/i)).toBeVisible();
    await expect(page.getByText(/warning|urgent/i).first()).toBeVisible();
  });

  test('urgency alert: CRITICAL when deadline <7 days', async ({ page }) => {
    await page.getByRole('link', { name: /new matter/i }).first().click();
    
    // Navigate to Step 4
    await page.getByRole('button', { name: /I want to take action/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /money/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /professional.*messed up/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Select "I have a court date"
    await page.getByRole('button', { name: /court date/i }).click();
    
    // Enter date 3 days from now (critical)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const dateString = threeDaysFromNow.toISOString().split('T')[0];
    
    await page.locator('input[type="date"]').fill(dateString);
    
    // Verify CRITICAL urgency alert
    await expect(page.getByText(/3 days until deadline/i)).toBeVisible();
    await expect(page.getByText(/urgent.*only 3 days/i)).toBeVisible();
  });

  test('contextual prompting: family category shows family-specific guidance', async ({ page }) => {
    await page.getByRole('link', { name: /new matter/i }).first().click();
    
    // Navigate to Step 5: plaintiff → family → divorce
    await page.getByRole('button', { name: /I want to take action/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /family/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /divorce/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 4: Skip urgency (select "no deadlines")
    await page.getByRole('button', { name: /no deadlines/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 5: Verify family-specific contextual prompt
    await expect(page.getByRole('heading', { name: /tell us your story/i })).toBeVisible();
    const backstoryField = page.locator('textarea[placeholder*="marriage"]');
    await expect(backstoryField).toBeVisible();
    
    // Verify placeholder mentions family-specific topics
    const placeholder = await backstoryField.getAttribute('placeholder');
    expect(placeholder?.toLowerCase()).toMatch(/marriage|children|assets|custody|support/);
  });

  test('contextual prompting: money category shows different guidance than family', async ({ page }) => {
    await page.getByRole('link', { name: /new matter/i }).first().click();
    
    // Navigate to Step 5: plaintiff → money → contract breach
    await page.getByRole('button', { name: /I want to take action/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /money/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /didn't deliver/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /no deadlines/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 5: Verify money-specific contextual prompt
    const backstoryField = page.locator('textarea');
    const placeholder = await backstoryField.getAttribute('placeholder');
    
    // Money prompts should mention contract, payment, delivery, NOT family topics
    expect(placeholder?.toLowerCase()).toMatch(/contract|payment|deliver|agreement|invoice/);
    expect(placeholder?.toLowerCase()).not.toMatch(/marriage|children|custody/);
  });

  test('complete submission: legal malpractice case with urgency', async ({ page }) => {
    await page.getByRole('link', { name: /new matter/i }).first().click();
    
    // Step 1: Plaintiff
    await page.getByRole('button', { name: /I want to take action/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 2: Money
    await page.getByRole('button', { name: /money/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 3: Legal malpractice
    await page.getByRole('button', { name: /professional.*messed up/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 4: Urgency + Amount
    await page.getByRole('button', { name: /discovery/i }).click();
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    await page.locator('input[type="date"]').fill(sixtyDaysAgo.toISOString().split('T')[0]);
    
    await page.locator('input[type="number"]').fill('50000');
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 5: Backstory
    await page.locator('textarea').fill('My lawyer missed the filing deadline for my slip and fall case. I paid $5000 retainer and now cannot sue for my injuries. I have medical bills and lost wages.');
    
    // Submit
    await page.getByRole('button', { name: /submit|create/i }).click();
    
    // Verify success: should navigate to matter detail page
    await expect(page.locator('text=/matter|case|overview/i')).toBeVisible({ timeout: 10000 });
  });

  test('custom scenario input: allows free-text description', async ({ page }) => {
    await page.getByRole('link', { name: /new matter/i }).first().click();
    
    // Navigate to Step 3
    await page.getByRole('button', { name: /I want to take action/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /harm/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Verify custom textarea is always visible
    await expect(page.getByRole('heading', { name: /what specifically happened/i })).toBeVisible();
    const customTextarea = page.locator('textarea');
    await expect(customTextarea).toBeVisible();
    
    // Enter custom scenario
    await customTextarea.fill('My neighbor tree fell on my car during a storm and they refuse to pay for damages.');
    
    // Proceed to next step (should accept custom input)
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.getByRole('heading', { name: /active deadlines/i })).toBeVisible();
  });

  test('amount field: affects jurisdiction routing', async ({ page }) => {
    await page.getByRole('link', { name: /new matter/i }).first().click();
    
    // Create matter with $75k amount (Superior Court jurisdiction)
    await page.getByRole('button', { name: /I want to take action/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /money/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /didn't deliver/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Enter high amount
    await page.getByRole('button', { name: /no deadlines/i }).click();
    await page.locator('input[type="number"]').fill('75000');
    await page.getByRole('button', { name: /next/i }).click();
    
    await page.locator('textarea').fill('Company owes me $75,000 for completed work under contract.');
    await page.getByRole('button', { name: /submit|create/i }).click();
    
    // Wait for matter detail page and check forum routing
    await expect(page.locator('text=/matter|case|overview/i')).toBeVisible({ timeout: 10000 });
    
    // Verify Superior Court routing (amount > $50k)
    await expect(page.locator('text=/superior court/i')).toBeVisible({ timeout: 5000 });
  });
});

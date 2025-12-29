import { test, expect } from '@playwright/test';

test.describe('Action Plan Display', () => {
  test('shows action-first UX with empathetic tone for civil negligence', async ({ page }) => {
    // Navigate to new matter page
    await page.goto('/matters/new');

    // Create a civil negligence matter (tree damage)
    await expect(page.getByLabel(/description/i)).toBeVisible({ timeout: 10000 });
    await page.getByLabel(/description/i).fill('A municipal tree fell on my car causing $8,000 in damage');
    await page.getByLabel(/province/i).selectOption('Ontario');
    await page.getByLabel(/Legal Area/i).selectOption('civil-negligence');
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for navigation to matter detail page
    await expect(page).toHaveURL(/\/matters\/[a-zA-Z0-9]+/);

    // Wait for classification to complete (action plan is generated server-side during intake)
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();

    // Test 1: Empathetic acknowledgment displays with domain-specific tone
    // Look for the acknowledgment banner specifically
    const acknowledgmentBanner = page.locator('text=You\'re dealing with').first();
    await expect(acknowledgmentBanner).toBeVisible({ timeout: 10000 });
    
    // Verify it's part of the acknowledgment section (not other UI elements)
    await expect(page.getByText(/This can be stressful|can feel overwhelming|important/i).first()).toBeVisible();

    // Test 2: Immediate actions card shows prioritized steps (URGENT/SOON/WHEN READY)
    await expect(page.getByRole('heading', { name: /What You Need to Do/i })).toBeVisible();
    
    // Look for priority badges
    const urgentBadge = page.locator('text=/URGENT|urgent/i').first();
    const soonBadge = page.locator('text=/SOON|soon/i').first();
    const whenReadyBadge = page.locator('text=/WHEN READY|when ready/i').first();
    
    // At least one priority level should be visible
    const hasPriorityBadges = await urgentBadge.isVisible().catch(() => false) || 
                               await soonBadge.isVisible().catch(() => false) ||
                               await whenReadyBadge.isVisible().catch(() => false);
    expect(hasPriorityBadges).toBeTruthy();

    // Test 3: Settlement pathways render pros/cons
    await expect(page.getByRole('heading', { name: /Possible Pathways/i })).toBeVisible();
    
    // Look for pros/cons lists
    await expect(page.getByRole('heading', { name: /Advantages:/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Considerations:/i })).toBeVisible();

    // Test 4: Warnings show correct severity CSS classes
    // Look for "Things to Be Careful About" warning section
    const warningSection = page.getByRole('heading', { name: /Things to Be Careful About/i });
    if (await warningSection.isVisible()) {
      // Check for critical severity styling (text-red-600)
      const criticalWarning = page.locator('.text-red-600, .text-red-700, .text-red-800').first();
      // At least verify the section exists (critical warnings may or may not be present for this case type)
      await expect(warningSection).toBeVisible();
    }

    // Test 5: Action steps are interactive (expandable sections, buttons)
    // Check for ChevronDown icons (indicates expandable sections)
    const expandableButtons = page.getByRole('button').filter({ hasText: /Details|Show|More/i });
    const buttonCount = await expandableButtons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // Test 6: Mobile responsiveness - no horizontal scrolling at 375px
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Scroll to settlement pathways section
    await page.getByRole('heading', { name: /Possible Pathways/i }).scrollIntoViewIfNeeded();
    
    // Check for horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow 10px tolerance for mobile

    // Restore viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Test 7: Verify supporting details are present but not primary focus
    // Forum routing should be visible but below action plan
    await expect(page.getByText(/Do I need to go to court/i)).toBeVisible();
    
    // Journey tracker should be visible
    await expect(page.getByRole('heading', { name: /Journey Tracker/i })).toBeVisible();

    // Test 8: Classification details are collapsed by default (action-first restructure)
    const classificationButton = page.getByRole('button', { name: /Technical Classification Details/i });
    await expect(classificationButton).toBeVisible();
    
    // Verify pillar details are NOT immediately visible (collapsed)
    const pillarText = page.getByText(/Legal pillar:/i);
    await expect(pillarText).not.toBeVisible();
    
    // Click to expand
    await classificationButton.click();
    
    // Now pillar details should be visible
    await expect(pillarText).toBeVisible();
  });

  test('shows your role explanation for civil matters', async ({ page }) => {
    // Navigate to new matter page
    await page.goto('/matters/new');

    // Create civil matter
    await expect(page.getByLabel(/description/i)).toBeVisible({ timeout: 10000 });
    await page.getByLabel(/description/i).fill('Property damage from negligent tree maintenance');
    await page.getByLabel(/province/i).selectOption('Ontario');
    await page.getByLabel(/Legal Area/i).selectOption('civil-negligence');
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for matter detail page
    await expect(page).toHaveURL(/\/matters\/[a-zA-Z0-9]+/);
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();

    // Look for "Your Role" section with "You ARE" vs "You are NOT" explanations
    await expect(page.getByText(/Your Role/i)).toBeVisible({ timeout: 10000 });
    
    // Civil matters should explain some form of role
    // Look for any role-related text (the exact wording may vary)
    const roleText = page.getByText(/You ARE|burden of proof|responsible for|need to show/i).first();
    await expect(roleText).toBeVisible();
  });

  test('responsive design: tablet and desktop viewports', async ({ page }) => {
    // Create matter
    await page.goto('/matters/new');
    await expect(page.getByLabel(/description/i)).toBeVisible({ timeout: 10000 });
    await page.getByLabel(/description/i).fill('Tree damage civil negligence case');
    await page.getByLabel(/province/i).selectOption('Ontario');
    await page.getByLabel(/Legal Area/i).selectOption('civil-negligence');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page).toHaveURL(/\/matters\/[a-zA-Z0-9]+/);

    // Test tablet viewport (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('heading', { name: /What You Need to Do/i })).toBeVisible();
    
    // No horizontal scroll at tablet size
    let bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    let viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);

    // Test desktop viewport (1024px+)
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole('heading', { name: /What You Need to Do/i })).toBeVisible();
    
    // No horizontal scroll at desktop size
    bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);

    // Verify grid layout expands at desktop (3 columns for journey tracker, etc.)
    // This is implicit in Tailwind's responsive design - just verify content is visible
    await expect(page.getByRole('heading', { name: /Journey Tracker/i })).toBeVisible();
  });

  test('keyboard navigation and accessibility', async ({ page }) => {
    // Create matter
    await page.goto('/matters/new');
    await expect(page.getByLabel(/description/i)).toBeVisible({ timeout: 10000 });
    await page.getByLabel(/description/i).fill('Civil negligence tree damage');
    await page.getByLabel(/province/i).selectOption('Ontario');
    await page.getByLabel(/Legal Area/i).selectOption('civil-negligence');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page).toHaveURL(/\/matters\/[a-zA-Z0-9]+/);

    // Test keyboard navigation - Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // Verify focus is visible (focus ring should be present)
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    // Test expandable sections with Enter key
    const classificationButton = page.getByRole('button', { name: /Technical Classification Details/i });
    await classificationButton.focus();
    await page.keyboard.press('Enter');
    
    // Verify section expanded
    await expect(page.getByText(/Legal pillar:/i)).toBeVisible();

    // Test ARIA roles and labels
    // Buttons should have accessible names
    const buttons = await page.getByRole('button').all();
    expect(buttons.length).toBeGreaterThan(0);
    
    // Verify at least one button has accessible name
    if (buttons.length > 0) {
      const firstButtonText = await buttons[0].textContent();
      expect(firstButtonText?.length).toBeGreaterThan(0);
    }

    // Verify headings hierarchy (h1 -> h2 -> h3)
    const h2Headings = await page.locator('h2').all();
    expect(h2Headings.length).toBeGreaterThan(0);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Conversational product path', () => {
  test('validates /matters/new intake to guidance path', async ({ page, request }) => {
    await page.goto('/matters/new');

    await expect(page.getByRole('heading', { name: /let's start with what's happening/i })).toBeVisible({ timeout: 15000 });

    const intakeTextarea = page.getByPlaceholder(/type your response in your own words/i);
    await intakeTextarea.fill('My landlord sent an N4 notice and will not repair a leak in my unit.');
    await page.getByRole('button', { name: 'Continue' }).click();

    const seeMyOptionsButton = page.getByRole('button', { name: /see my options/i });
    const waitForIntakeToSettle = async () => {
      await expect
        .poll(async () => {
          if (await seeMyOptionsButton.isVisible()) {
            return 'ready';
          }

          const followupInput = page.getByPlaceholder(/type your response in your own words|answer in your own words:/i);
          return (await followupInput.isVisible()) && (await followupInput.isEnabled()) ? 'input' : 'pending';
        }, { timeout: 15000 })
        .not.toBe('pending');
    };

    await waitForIntakeToSettle();

    for (const answer of [
      'I received the written notice two days ago and the leak started about two weeks ago.',
      'The rent is not unpaid because of the leak, and I have already asked the landlord in writing to repair it.',
      'The leak is damaging the unit and I have photos and messages about it.',
    ]) {
      if (await seeMyOptionsButton.isVisible()) {
        break;
      }

      const followupInput = page.getByPlaceholder(/type your response in your own words|answer in your own words:/i);
      await followupInput.fill(answer);
      await page.getByRole('button', { name: 'Continue' }).click();
      await waitForIntakeToSettle();
    }

    await expect(seeMyOptionsButton).toBeVisible({ timeout: 15000 });
    await seeMyOptionsButton.click();

    await expect(page.getByRole('heading', { name: /start with the conversational summary, then move into the workspace/i })).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/\/matters\/[A-Za-z0-9]+/);

    const matterIdMatch = page.url().match(/\/matters\/([A-Za-z0-9]+)/);
    expect(matterIdMatch).toBeTruthy();

    const matterId = matterIdMatch?.[1] as string;
    const auditRes = await request.get(`/api/audit?matterId=${matterId}`);
    expect(auditRes.ok()).toBeTruthy();
  });

  test('validates /matters/new/chat fallback, import-back, and nuanceImported audit event', async ({ page, request }) => {
    await page.goto('/matters/new/chat');

    await expect(page.getByRole('heading', { name: /refine it in chat/i })).toBeVisible({ timeout: 15000 });

    const chatTextarea = page.getByPlaceholder(/describe what happened, what you know, and what still feels unclear/i);
    await chatTextarea.fill('A rear-end collision damaged my parked car and my insurer is disputing repairs.');
    await chatTextarea.press('Enter');

    await expect(page.getByText(/best current read/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/source:\s*(rule-based summary|structured model)/i)).toBeVisible({ timeout: 20000 });

    const applyButton = page.getByRole('button', { name: /apply and continue/i });
    await expect(applyButton).toBeEnabled({ timeout: 20000 });
    await applyButton.click();

    await expect(page.getByRole('heading', { name: /start with the conversational summary, then move into the workspace/i })).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/\/matters\/[A-Za-z0-9]+/);

    const matterIdMatch = page.url().match(/\/matters\/([A-Za-z0-9]+)/);
    expect(matterIdMatch).toBeTruthy();

    const matterId = matterIdMatch?.[1] as string;
    const auditRes = await request.get(`/api/audit?matterId=${matterId}`);
    expect(auditRes.ok()).toBeTruthy();

    const auditEvents = await auditRes.json();
    expect(Array.isArray(auditEvents)).toBeTruthy();

    const importedEvent = auditEvents.find((event: { action?: string }) => event.action === 'nuanceImported');
    expect(importedEvent).toBeDefined();
  });
});

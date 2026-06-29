import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers.js';

test('anonymous visitor is prompted to log in when bookmarking', async ({ page }) => {
  const dialogs = [];
  page.on('dialog', (d) => {
    dialogs.push(d.message());
    d.accept();
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Save question' }).first().click();

  expect(dialogs.join(' ')).toMatch(/logged in/i);
});

test('a logged-in user can bookmark a question and it persists across reload', async ({
  page,
}) => {
  await registerAndLogin(page);

  // Bookmark the first question in the feed.
  const saveBtn = page.getByRole('button', { name: 'Save question' }).first();
  await expect(saveBtn).toBeVisible();
  await saveBtn.click();

  // Icon flips to the saved state immediately (no reload).
  await expect(
    page.getByRole('button', { name: 'Unsave question' }).first(),
  ).toBeVisible();

  // Reload: saved state is hydrated from the backend on app load.
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Unsave question' }).first(),
  ).toBeVisible({ timeout: 15000 });

  // It also appears in the profile "Saved Questions" section.
  await page.goto('/profile');
  await expect(
    page.getByRole('heading', { name: 'Saved Questions' }),
  ).toBeVisible();
  await expect(page.getByText('No saved questions yet')).toHaveCount(0);
});

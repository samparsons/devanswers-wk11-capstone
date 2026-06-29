import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers.js';

test('an author can edit their own question and see an "edited" indicator', async ({
  page,
}) => {
  // The post-success alert must be auto-accepted.
  page.on('dialog', (d) => d.accept());

  await registerAndLogin(page);

  // Post a question so the logged-in user is its author.
  await page.goto('/ask');
  const title = `E2E question ${Date.now()}`;
  await page.locator('#title').fill(title);
  await page
    .locator('#description')
    .fill('Original description created by the E2E test.');
  await page.locator('#tags').fill('e2e, testing');
  await page.getByRole('button', { name: /post question/i }).click();

  // Lands on the detail page; the author sees the edit pencil.
  await page.waitForURL(/\/question\//, { timeout: 15000 });
  const editBtn = page.getByRole('button', { name: 'Edit question' });
  await expect(editBtn).toBeVisible();

  // Edit the title and save.
  await editBtn.click();
  const titleField = page.getByLabel('Title');
  await titleField.fill(`${title} (edited)`);
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  // Updated content shows immediately, with an "edited" indicator.
  await expect(
    page.getByRole('heading', { name: `${title} (edited)` }),
  ).toBeVisible();
  await expect(page.getByText(/edited/i).first()).toBeVisible();
});

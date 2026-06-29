import { test, expect } from '@playwright/test';

test('home page loads with app branding', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/DevAnswers/i);
  await expect(
    page.getByRole('heading', { name: 'DevAnswers' }),
  ).toBeVisible();
});

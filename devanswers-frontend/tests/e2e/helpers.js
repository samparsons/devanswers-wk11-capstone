// Shared E2E helpers. Each run registers a fresh user so tests are independent
// and don't depend on seed credentials.

export async function registerAndLogin(page) {
  const email = `e2e+${Date.now()}@example.com`;
  const password = 'password123';

  await page.goto('/register');
  const registerCard = page.locator('.auth-card');
  await registerCard.getByPlaceholder('Enter your full name').fill('E2E User');
  await registerCard.getByPlaceholder('Enter your email').fill(email);
  await registerCard.getByPlaceholder('Create a password').fill(password);
  await registerCard.getByPlaceholder('Confirm your password').fill(password);
  await registerCard.getByRole('button', { name: /register/i }).click();

  // Register redirects to /login on success.
  await page.waitForURL('**/login', { timeout: 15000 });

  const loginCard = page.locator('.auth-card');
  await loginCard.getByPlaceholder('Enter your email').fill(email);
  await loginCard.getByPlaceholder('Enter your password').fill(password);
  await loginCard.getByRole('button', { name: /login/i }).click();

  // Successful login redirects home.
  await page.waitForURL('http://127.0.0.1:4173/', { timeout: 15000 });
  return { email, password };
}

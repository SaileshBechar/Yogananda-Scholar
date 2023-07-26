import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Yogananda Scholar/);
});

test('send chat', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.getByPlaceholder("Ask a question").fill("what chapter was the perfume saint?")
  // Click the get started link.
  await page.getByTestId("send-button").click();

  // Expects the URL to contain intro.
  await expect(page.getByText("what chapter was the perfume saint?")).toBeTruthy()
  
  await expect(page.getByText("Chapter 5")).toBeTruthy()
});

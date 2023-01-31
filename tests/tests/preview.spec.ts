import { test } from '@playwright/test';

test('go to preview page', async ({ page }) => {
  await page.goto('/');
});

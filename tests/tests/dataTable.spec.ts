import { test, expect } from '@playwright/test';
import { supportLocalDev } from "./goto"
test('test', async ({ page }) => {
    await page.goto('/tables/new-tables', supportLocalDev());
    await page.getByPlaceholder('Search').click();
    await page.getByPlaceholder('Search').fill('Chi');
});
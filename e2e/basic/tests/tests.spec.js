// @ts-check
import { test, expect } from '@playwright/test';
import { waitForPageToLoad } from '../../test-utils';

test('has title', async ({ page }) => {
	await page.goto('/');
	await waitForPageToLoad(page);

	await expect(page).toHaveTitle(/Welcome to Evidence/);
});

test('has hidden sidebar', async ({ page }) => {
	await page.goto('/');
	await waitForPageToLoad(page);

	await expect(page.getByRole('button', { name: 'Open sidebar' })).toBeVisible();
});

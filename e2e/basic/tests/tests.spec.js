// @ts-check
import { test, expect } from '@playwright/test';
import { getLogo, switchAppearance, waitForPageToLoad } from '../../test-utils';

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

test('shows different logo in light and dark mode', async ({ page }) => {
	await page.goto('/');
	await waitForPageToLoad(page);

	await switchAppearance(page, 'light');
	let logo = await getLogo(page);
	await expect(logo).toHaveAttribute('src', '/lightLogo.png');

	await switchAppearance(page, 'dark');
	logo = await getLogo(page);
	await expect(logo).toHaveAttribute('src', '/darkLogo.png');
});

test('bare query reference', async ({ page }) => {
	await page.goto('/');
	await waitForPageToLoad(page);

	await expect(page.getByText('The top category is Odd Equipment')).toBeVisible();
});

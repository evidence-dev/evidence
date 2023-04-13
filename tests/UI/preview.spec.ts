import { test } from '@playwright/test';

const target = process.env.CI ? 'preview' : 'localhost';
const title = `UI Tests can reach: ${target}`;
test(title, async ({ page }) => {
	await page.goto('/');
});

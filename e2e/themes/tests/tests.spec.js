// @ts-check
import { test, expect } from '@playwright/test';
import { switchAppearance, waitForDevModeToLoad } from '../../test-utils';

test('should change colors based on theme', async ({ page }) => {
	await page.goto('/');
	await waitForDevModeToLoad(page);

	const divWithBackground = await page.getByTestId('div-with-background');

	await switchAppearance(page, 'system');
	await expect(divWithBackground).toHaveCSS('background-color', 'rgb(0, 255, 0)');

	await switchAppearance(page, 'light');
	await expect(divWithBackground).toHaveCSS('background-color', 'rgb(255, 0, 0)');

	await switchAppearance(page, 'dark');
	await expect(divWithBackground).toHaveCSS('background-color', 'rgb(0, 255, 0)');
});

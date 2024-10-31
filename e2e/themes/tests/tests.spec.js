// @ts-check
import { test, expect } from '@playwright/test';
import { waitForDevModeToLoad } from '../../test-utils';

test('should change color based on theme', async ({ page }) => {
	await page.goto('/');
	await waitForDevModeToLoad(page);

	const divWithBackground = await page.getByTestId('div-with-background');

	// Starts with system theme (dark)
	await expect(divWithBackground).toHaveCSS('background-color', 'rgb(0, 255, 0)');

	await page.getByLabel('Menu').click();

	// Light theme
	await page.getByRole('menuitem', { name: 'Appearance' }).click();
	await expect(divWithBackground).toHaveCSS('background-color', 'rgb(255, 0, 0)');

	// Dark theme
	await page.getByRole('menuitem', { name: 'Appearance' }).click();
	await expect(divWithBackground).toHaveCSS('background-color', 'rgb(0, 255, 0)');
});

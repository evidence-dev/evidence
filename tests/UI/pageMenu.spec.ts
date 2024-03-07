import { test, expect, Locator } from '@playwright/test';
import { supportLocalDev } from './local';

test.beforeEach(async ({ page }) => {
	await page.goto('/queries/writing-queries', supportLocalDev());
	await page.waitForTimeout(500);
});

test.describe('Page Elements: Page Menu', () => {
	test('should be able click page menu to open, and click again to close', async ({ page }) => {
		const pageMenuButton: Locator = await page.locator('#layout-kebab');
		const exportPDFButton: Locator = await page.getByRole('menuitem', { name: 'Print PDF ⌘P' });

		// click on the page menu button
		await pageMenuButton.click();
		await page.waitForTimeout(600);

		// should see the export PDF button and settings link
		expect(await exportPDFButton.isVisible()).toEqual(true);
	});
});

import { test, expect, Locator } from '@playwright/test';
import { supportLocalDev } from './local';

test.beforeEach(async ({ page }) => {
	await page.goto('/charts/area-chart', supportLocalDev());
	await page.waitForTimeout(500);
});

test.describe('Charts: Area', () => {
	test('should be able to hide/show query and see SQL code', async ({ page }) => {
		const pageMenuButton: Locator = await page
			.getByRole('banner')
			.getByRole('button', { name: 'page menu button' });
		const showQueryButton: Locator = await page.getByRole('button', { name: 'show-queries' });
		const hideQueryButton: Locator = await page.getByRole('button', { name: 'hide-queries' });
		const showSQLButton: Locator = await page.getByRole('button', { name: 'show-sql' });

		// show and hide button must be mutual exclusive
		const isHideVisible: boolean = await hideQueryButton.isVisible();
		const isShowVisible: boolean = await showQueryButton.isVisible();

		// click on the page menu button
		await pageMenuButton.click();
		// wait for animation
		await page.waitForTimeout(100);

		// if hide query button is visible, user should be able to hide query section
		if (await hideQueryButton.isVisible()) {
			// if one is visible the other must not be hidden
			expect(isShowVisible).toEqual(false);
			await hideQueryButton.click();

			// wait for the svelte dom manipulation
			await page.waitForTimeout(500);

			// the show SQL button should not be available
			expect(await showSQLButton.isVisible()).toEqual(false);
		}

		if (await showQueryButton.isVisible()) {
			// if one is visible the other must not be hidden
			expect(isHideVisible).toEqual(false);

			await showQueryButton.click();
			// show-SQL button should be visible
			await expect(showSQLButton).toBeVisible();

			// click on the show-SQL button
			await showSQLButton.click();

			// wait for animation
			await page.waitForTimeout(100);
			// should see only one SQL code container
			const SQLCodeContainers: Locator[] = await page.locator('div .code-container').all();
			expect(SQLCodeContainers.length).toEqual(1);
			await expect(SQLCodeContainers[0]).toBeVisible();
		}
	});
	test('should see save button, download button and tooltip when mouse is hover the chart', async ({
		page
	}) => {
		await page.locator('g').locator('g path').first().hover();
		// wait for svelte animation
		await page.waitForTimeout(300);

		// grab the save and download button
		const saveImageButton: Locator = await page.getByRole('button', { name: 'Save image' });
		const downloadDataButton: Locator = await page.getByRole('button', { name: 'Download data' });

		// button should be visible
		await expect(saveImageButton).toBeVisible();
		await expect(downloadDataButton).toBeVisible();

		// tooltip should be visible
		const tooltip: Locator = await page.locator('#tooltip');
		await expect(tooltip).toBeVisible();
	});
});

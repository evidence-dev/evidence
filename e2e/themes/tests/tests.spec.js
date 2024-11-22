// @ts-check
import { test, expect } from '@playwright/test';
import { switchAppearance, waitForPageToLoad } from '../../test-utils';

test('should change colors based on theme', async ({ page }) => {
	await page.goto('/');
	await waitForPageToLoad(page);

	const divPrimaryClass = await page.getByTestId('div-primary-class');
	const divPrimaryVar = await page.getByTestId('div-primary-var');
	const divMyCustomColorClass = await page.getByTestId('div-myCustomColor-class');
	const divMyCustomColorVar = await page.getByTestId('div-myCustomColor-var');

	await switchAppearance(page, 'system');
	await expect(divPrimaryClass).toHaveCSS('background-color', 'rgb(0, 255, 0)');
	await expect(divPrimaryVar).toHaveCSS('background-color', 'rgb(0, 255, 0)');
	await expect(divMyCustomColorClass).toHaveCSS('background-color', 'rgb(254, 220, 186)');
	await expect(divMyCustomColorVar).toHaveCSS('background-color', 'rgb(254, 220, 186)');

	await switchAppearance(page, 'light');
	await expect(divPrimaryClass).toHaveCSS('background-color', 'rgb(255, 0, 0)');
	await expect(divPrimaryVar).toHaveCSS('background-color', 'rgb(255, 0, 0)');
	await expect(divMyCustomColorClass).toHaveCSS('background-color', 'rgb(171, 205, 239)');
	await expect(divMyCustomColorVar).toHaveCSS('background-color', 'rgb(171, 205, 239)');

	await switchAppearance(page, 'dark');
	await expect(divPrimaryClass).toHaveCSS('background-color', 'rgb(0, 255, 0)');
	await expect(divPrimaryVar).toHaveCSS('background-color', 'rgb(0, 255, 0)');
	await expect(divMyCustomColorClass).toHaveCSS('background-color', 'rgb(254, 220, 186)');
	await expect(divMyCustomColorVar).toHaveCSS('background-color', 'rgb(254, 220, 186)');
});

test('body text should be computed from base', async ({ page }) => {
	await page.goto('/');
	await waitForPageToLoad(page);

	const body = await page.locator('body');
	const text = await page.getByText('This is some body text');

	await switchAppearance(page, 'system');
	await expect(text).toHaveCSS('color', 'rgb(248, 236, 248)');
	await expect(body).toHaveCSS('background-color', 'rgb(23, 1, 24)');

	await switchAppearance(page, 'light');
	await expect(text).toHaveCSS('color', 'rgb(17, 6, 19)');
	await expect(body).toHaveCSS('background-color', 'rgb(253, 244, 255)');

	await switchAppearance(page, 'dark');
	await expect(text).toHaveCSS('color', 'rgb(248, 236, 248)');
	await expect(body).toHaveCSS('background-color', 'rgb(23, 1, 24)');
});

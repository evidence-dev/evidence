// @ts-check
import { test, expect } from '@playwright/test';
import { waitForPageToLoad } from '../../test-utils';

test('templated page uses query param', async ({ page }) => {
	const param = 'bing-bong';
	await page.goto(`/${param}`);
	await waitForPageToLoad(page);
	await expect(page.getByText(`This page uses a query param: ${param}`)).toBeVisible();
});

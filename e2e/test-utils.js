/** @typedef {import('@playwright/test').Page} Page */
import { expect } from '@playwright/test';

/** @param {Page} page */
export const waitForPageToLoad = async (page) => {
	await Promise.all([page.waitForTimeout(100), page.waitForLoadState('networkidle')]);

	await expect(page.getByTestId('#__evidence_project_splash')).not.toBeVisible();
};

/** @param {Page} page */
export function waitForWasm(page) {
	const context = page.context();
	return new Promise((res) => {
		context.route(/duckdb-eh\..*?\.wasm$/, async (route) => {
			await route.abort();
			res(undefined);
		});
	});
}

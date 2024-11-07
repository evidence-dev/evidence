import { expect } from '@playwright/test';

export const waitForDevModeToLoad = async (page) => {
	if (!process.env.DEV) return;

	await Promise.all([page.waitForTimeout(100), page.waitForLoadState('networkidle')]);

	await expect(page.getByTestId('#__evidence_project_splash')).not.toBeVisible();
};

/** @param {import("@playwright/test").Page} page */
export function waitForWasm(page) {
	const context = page.context();
	return new Promise((res) => {
		context.route(/duckdb-eh\..*?\.wasm$/, async (route) => {
			await route.abort();
			res(undefined);
		});
	});
}

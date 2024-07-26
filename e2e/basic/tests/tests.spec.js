// @ts-check
import { test, expect } from '@playwright/test';

const waitForDevModeToLoad = async (page) => {
	if (!process.env.DEV) return;

	await Promise.all([page.waitForTimeout(100), page.waitForLoadState('networkidle')]);

	await expect(page.getByTestId('#__evidence_project_splash')).not.toBeVisible();
};

test('has title', async ({ page }) => {
	await page.goto('/');
	await waitForDevModeToLoad(page);

	await expect(page).toHaveTitle(/Welcome to Evidence/);
});

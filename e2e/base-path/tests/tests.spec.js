// @ts-check
import { test, expect } from '@playwright/test';
import { waitForDevModeToLoad } from '../../test-utils';

test('has title', async ({ page }) => {
	await page.goto('/');
	await waitForDevModeToLoad(page);

	await expect(page).toHaveTitle(/Welcome to Evidence/);
});

/*
To test
- Assets (favicon)
- InvisibleLinks
- Page
  - Settings page
	- Sidebar links
	- Kebab menu
	- Logo
	- Breadcrumbs
- Components
  - Table row links
	- BigValue
	- LinkButton
	- BigLink
*/

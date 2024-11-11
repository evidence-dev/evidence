// @ts-check
import { test, expect } from '@playwright/test';
import { getEvidenceConfig } from '@evidence-dev/sdk/config';
import { waitForDevModeToLoad } from '../../test-utils';

const config = getEvidenceConfig();
const basePath = config.deployment.basePath;

test.describe('<head />', () => {
	test('<link rel="icon" /> href should start with basePath', async ({ page }) => {
		await page.goto('/');
		await waitForDevModeToLoad(page);

		const links = await page.locator('link[rel="icon"]').all();
		expect(links).not.toHaveLength(0);

		await Promise.all(
			links.map(async (link) => {
				const href = await link.getAttribute('href');
				expect(href, { message: `Expected href for ${link} to exist` }).not.toBeNull();

				let path = href;
				if (href?.startsWith('http')) {
					try {
						path = new URL(href).pathname;
					} catch (e) {
						expect(e, { message: `Expected href '${href}' to be a valid URL` }).toBeNull();
					}
				}

				expect(path?.startsWith(basePath), {
					message: `Expected <link /> path '${path}' to start with base path '${basePath}'`
				}).toBeTruthy();
			})
		);
	});

	// This test will fail until we can use the basePath in the <link rel="manifest" /> tag
	test.skip('manifest.webmanifest icons.src should start with basePath', async ({ page }) => {
		await page.goto('/');
		await waitForDevModeToLoad(page);

		const manifestLink = await page.locator('link[rel="manifest"]');
		expect(manifestLink, { message: 'Expected page to have a <link /> to a manifest' }).toHaveCount(
			1
		);

		const manifestHref = await manifestLink.getAttribute('href');
		expect(manifestHref).not.toBeNull();

		/** @type {import('web-app-manifest').WebAppManifest} */
		const manifest = await page
			.goto(/** @type {string} */ (manifestHref))
			.then((res) => res?.json());

		manifest.icons?.forEach((icon) => {
			expect(icon.src.startsWith(basePath), {
				message: `Expected icon src '${icon.src}' to start with base path '${basePath}'`
			}).toBeTruthy();
		});
	});
});

/*
To test
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

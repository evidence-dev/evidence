// @ts-check
import { test, expect } from '@playwright/test';
import { getEvidenceConfig } from '@evidence-dev/sdk/config';
import { waitForDevModeToLoad } from '../../test-utils';

const config = getEvidenceConfig();
const basePath = config.deployment.basePath;

test.describe('<head />', () => {
	test('<link rel="icon" /> href should start with basePath', async ({ page }) => {
		await page.goto(basePath);
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

	test('manifest.webmanifest icons.src should start with basePath', async ({ page }) => {
		await page.goto(basePath);
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

test.describe('Page', () => {
	test('sidebar and logo links should use base path', async ({ page }) => {
		await page.goto(basePath);
		await waitForDevModeToLoad(page);

		const pageASidebarLink = await page.getByRole('link', { name: 'Page A' });
		await pageASidebarLink.click();
		await expect(page.getByText('This is Page A', { exact: true })).toBeVisible();
		expect(new URL(page.url()).pathname).toBe(`${basePath}/page-a/`);

		const sidebar = pageASidebarLink.locator('..');

		const homeSidebarLink = await sidebar.getByRole('link', { name: 'Home' });
		await homeSidebarLink.click();
		await expect(page.getByText('Welcome to Evidence', { exact: true })).toBeVisible();
		expect(new URL(page.url()).pathname).toBe(`${basePath}/`);

		const pageBSidebarLink = await page.getByRole('link', { name: 'Page B' });
		await pageBSidebarLink.click();
		await expect(page.getByText('This is Page B', { exact: true })).toBeVisible();
		expect(new URL(page.url()).pathname).toBe(`${basePath}/page-b/`);

		const logoLink = await page.getByAltText('Home');
		await logoLink.click();
		await expect(page.getByText('Welcome to Evidence', { exact: true })).toBeVisible();
		expect(new URL(page.url()).pathname).toBe(`${basePath}/`);
	});
	test('breadcrumbs should use base path', async ({ page }) => {
		await page.goto(`${basePath}/nested/page-c`);
		await waitForDevModeToLoad(page);

		const nestedCrumb = await page.getByRole('link', { name: 'Nested' });
		await nestedCrumb.click();
		await expect(page.getByText('This is a nested page')).toBeVisible();
		await expect(new URL(page.url()).pathname).toBe(`${basePath}/nested/`);

		const breadcrumbs = nestedCrumb.locator('..');

		await breadcrumbs.getByRole('link', { name: 'Home' }).click();
		await expect(page.getByText('Welcome to Evidence', { exact: true })).toBeVisible();
		await expect(new URL(page.url()).pathname).toBe(`${basePath}/`);
	});
});

/*
To test
- Components
  - Table row links
	- BigValue
	- LinkButton
	- BigLink
*/

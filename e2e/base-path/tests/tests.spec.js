// @ts-check
import { test, expect } from '@playwright/test';
import { getEvidenceConfig } from '@evidence-dev/sdk/config';
import { waitForPageToLoad } from '../../test-utils';

const config = getEvidenceConfig();
const basePath = config.deployment.basePath;

test.describe('<head />', () => {
	test('<link rel="icon" /> href should start with basePath', async ({ page }) => {
		await page.goto(basePath);
		await waitForPageToLoad(page);

		const links = await page.locator('link[rel="icon"]').all();
		await expect(links).not.toHaveLength(0);

		await Promise.all(
			links.map(async (link) => {
				const href = await link.getAttribute('href');
				await expect(href, { message: `Expected href for ${link} to exist` }).not.toBeNull();

				let path = href;
				if (href?.startsWith('http')) {
					try {
						path = new URL(href).pathname;
					} catch (e) {
						await expect(e, { message: `Expected href '${href}' to be a valid URL` }).toBeNull();
					}
				}

				await expect(path?.startsWith(basePath), {
					message: `Expected <link /> path '${path}' to start with base path '${basePath}'`
				}).toBeTruthy();
			})
		);
	});

	test('manifest.webmanifest icons.src should start with basePath', async ({ page }) => {
		await page.goto(basePath);
		await waitForPageToLoad(page);

		const manifestLink = await page.locator('link[rel="manifest"]');
		await expect(manifestLink, {
			message: 'Expected page to have a <link /> to a manifest'
		}).toHaveCount(1);

		const manifestHref = await manifestLink.getAttribute('href');
		await expect(manifestHref).not.toBeNull();

		const manifestUrl = new URL(/** @type {string} */ (manifestHref), new URL(page.url()));
		/** @type {import('web-app-manifest').WebAppManifest} */
		const manifest = await fetch(manifestUrl).then((res) => res?.json());

		await Promise.all(
			(manifest.icons ?? []).map(async (icon) => {
				await expect(icon.src.startsWith(basePath), {
					message: `Expected icon src '${icon.src}' to start with base path '${basePath}'`
				}).toBeTruthy();
			})
		);
	});

	test('og:image should start with basePath', async ({ page }) => {
		await page.goto(`${basePath}/og-image`);
		await waitForPageToLoad(page);

		const ogImage = await page.locator('meta[property="og:image"]');
		await expect(ogImage, {
			message: 'Expected og-image.md to have an og:image meta tag'
		}).toHaveCount(1);

		const ogImageContent = await ogImage.getAttribute('content');
		await expect(ogImageContent, {
			message: 'Expected og:image content to exist'
		}).not.toBeNull();

		await expect(ogImageContent?.startsWith(basePath), {
			message: `Expected og:image content '${ogImageContent}' to start with base path '${basePath}'`
		}).toBeTruthy();
	});
});

test.describe('Page', () => {
	test('sidebar and logo links should use base path', async ({ page }) => {
		await page.goto(basePath);
		await waitForPageToLoad(page);

		const sidebar = await page.locator('aside').first();

		const pageASidebarLink = await sidebar.getByRole('link', { name: 'Page A' });
		await pageASidebarLink.click();
		await waitForPageToLoad(page);

		await expect(page.getByText('This is Page A', { exact: true })).toBeVisible();
		await expect(new URL(page.url()).pathname).toBe(`${basePath}/page-a/`);

		const homeSidebarLink = await sidebar.getByRole('link', { name: 'Home' });
		await homeSidebarLink.click();
		await waitForPageToLoad(page);

		await expect(page.getByText('Welcome to Evidence', { exact: true })).toBeVisible();
		await expect(new URL(page.url()).pathname).toBe(`${basePath}/`);

		const pageBSidebarLink = await sidebar.getByRole('link', { name: 'Page B' });
		await pageBSidebarLink.click();
		await waitForPageToLoad(page);

		await expect(page.getByText('This is Page B', { exact: true })).toBeVisible();
		await expect(new URL(page.url()).pathname).toBe(`${basePath}/page-b/`);

		const logoLink = await page.getByAltText('Home').first();
		await logoLink.click();
		await waitForPageToLoad(page);

		await expect(page.getByText('Welcome to Evidence', { exact: true })).toBeVisible();
		await expect(new URL(page.url()).pathname).toBe(`${basePath}/`);
	});
	test('breadcrumbs should use base path', async ({ page }) => {
		await page.goto(`${basePath}/nested/page-c`);
		await waitForPageToLoad(page);

		const nestedCrumb = await page.getByRole('link', { name: 'Nested' });
		await nestedCrumb.click();
		await waitForPageToLoad(page);

		await expect(page.getByText('This is a nested page')).toBeVisible();
		await expect(new URL(page.url()).pathname).toBe(`${basePath}/nested/`);

		const breadcrumbs = nestedCrumb.locator('..');

		await breadcrumbs.getByRole('link', { name: 'Home' }).click();
		await waitForPageToLoad(page);

		await expect(page.getByText('Welcome to Evidence', { exact: true })).toBeVisible();
		await expect(new URL(page.url()).pathname).toBe(`${basePath}/`);
	});

	test('<img /> and ![]() should use base path', async ({ page }) => {
		await page.goto(`${basePath}/images-and-links`);
		await waitForPageToLoad(page);

		const images = await page.getByRole('img', { name: 'Twitter Card' }).all();
		await expect(images).not.toHaveLength(0);

		await Promise.all(
			images.map(async (image) => {
				const src = await image.getAttribute('src');
				await expect(src, { message: `Expected src for ${image} to exist` }).not.toBeNull();

				let path = src;
				if (src?.startsWith('http')) {
					try {
						path = new URL(src).pathname;
					} catch (e) {
						await expect(e, { message: `Expected src '${src}' to be a valid URL` }).toBeNull();
					}
				}

				await expect(path?.startsWith(basePath), {
					message: `Expected <img /> path '${path}' to start with base path '${basePath}'`
				}).toBeTruthy();
			})
		);
	});
	test('<a /> and []() should use base path', async ({ page }) => {
		await page.goto(`${basePath}/images-and-links`);
		await waitForPageToLoad(page);

		const links = await page.getByRole('link', { name: 'Go to page a' }).all();
		await expect(links).not.toHaveLength(0);

		await Promise.all(
			links.map(async (link) => {
				const href = await link.getAttribute('href');
				await expect(href, { message: `Expected href for ${link} to exist` }).not.toBeNull();

				let path = href;
				if (href?.startsWith('http')) {
					try {
						path = new URL(href).pathname;
					} catch (e) {
						await expect(e, { message: `Expected href '${href}' to be a valid URL` }).toBeNull();
					}
				}

				await expect(path?.startsWith(basePath), {
					message: `Expected path '${path}' to start with base path '${basePath}'`
				}).toBeTruthy();
			})
		);
	});
});

test.describe('Parquet Files', () => {
	test('Manifest links should use base path', async ({ page }) => {
		await page.goto(basePath);
		await waitForPageToLoad(page);
		
		const req = await page.waitForRequest(`http://localhost:3000${basePath}/data/needful_things/orders/orders.parquet`);
		const res = await req.response();
		expect(res?.ok()).toBe(true);
	});
});

test.describe('Components', () => {
	test('Table row links should use base path', async ({ page }) => {
		await page.goto(`${basePath}/table-row-links`);
		await waitForPageToLoad(page);

		const pageALink = await page.getByRole('cell', { name: '/page-a' });
		await pageALink.click();
		await waitForPageToLoad(page);

		await expect(page.getByText('This is Page A')).toBeVisible();
		await expect(new URL(page.url()).pathname).toBe(`${basePath}/page-a/`);

		await page.goto(`${basePath}/table-row-links`);
		await waitForPageToLoad(page);

		const pageCLink = await page.getByRole('cell', { name: '/nested/page-c' });
		await pageCLink.click();
		await waitForPageToLoad(page);

		await expect(page.getByText('This is Page C')).toBeVisible();
		await expect(new URL(page.url()).pathname).toBe(`${basePath}/nested/page-c/`);
	});

	test('BigValue link should use base path', async ({ page }) => {
		await page.goto(`${basePath}/big-value-link`);
		await waitForPageToLoad(page);

		const bigValueLink = await page.getByRole('link', { name: '123' });
		await bigValueLink.click();
		await waitForPageToLoad(page);

		await expect(page.getByText('This is Page B')).toBeVisible();
		await expect(new URL(page.url()).pathname).toBe(`${basePath}/page-b/`);
	});

	test('LinkButton should use base path', async ({ page }) => {
		await page.goto(`${basePath}/link-button`);
		await waitForPageToLoad(page);

		const linkButton = await page.getByRole('link', { name: 'Go to page a' });
		await linkButton.click();
		await waitForPageToLoad(page);

		await expect(page.getByText('This is Page A')).toBeVisible();
		await expect(new URL(page.url()).pathname).toBe(`${basePath}/page-a/`);
	});

	test('BigLink should use base path', async ({ page }) => {
		await page.goto(`${basePath}/big-link`);
		await waitForPageToLoad(page);

		const bigLink = await page.getByRole('link', { name: 'Go to page c' });
		await bigLink.click();
		await waitForPageToLoad(page);

		await expect(page.getByText('This is Page C')).toBeVisible();
		await expect(new URL(page.url()).pathname).toBe(`${basePath}/nested/page-c/`);
	});

	test('addBasePath should work in custom components', async ({ page }) => {
		await page.goto(`${basePath}/using-custom-component`);
		await waitForPageToLoad(page);

		const pageBLink = await page.getByRole('link', { name: 'Go to page b' });
		await pageBLink.click();
		await waitForPageToLoad(page);

		await expect(page.getByText('This is Page B')).toBeVisible();
		await expect(new URL(page.url()).pathname).toBe(`${basePath}/page-b/`);
	});
});

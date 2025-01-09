// @ts-check
import { test, expect } from '@playwright/test';
import { createFile, deleteFile, editFile, restoreChangedFiles } from './fs-utils';
import { waitForPageToLoad } from '../../test-utils';

/** @param {import("@playwright/test").Page} page */
const waitForHMR = async (page) => {
	await page.waitForEvent('console', (message) => {
		return message.text().startsWith('[vite] hot updated');
	});
};

test.afterEach(() => {
	restoreChangedFiles();
});

test.describe('pages', () => {
	test('editing should HMR', async ({ page }) => {
		await page.goto('/page');
		await waitForPageToLoad(page);

		await expect(page.getByText('This page has some text on it')).toBeVisible();

		editFile('pages/page.md', (content) => content.replace('some text', 'some different text'));
		await waitForHMR(page);

		await expect(page.getByText('This page has some different text on it')).toBeVisible();
	});

	test('creating should add to the sidebar and allow navigation', async ({ page }) => {
		await page.goto('/');
		await waitForPageToLoad(page);

		await expect(page.getByText('Index')).toBeVisible();

		createFile('pages/new-page.md', 'This is a new page');
		// file deletions trigger full reload, so we don't waitForHMR() here

		await expect(page.getByRole('link', { name: 'New Page' })).toBeVisible();
		await page.goto('/new-page');
		await expect(page.getByText('This is a new page')).toBeVisible();
	});

	test('deleting should remove from the sidebar and prevent navigation', async ({ page }) => {
		await page.goto('/');
		await waitForPageToLoad(page);

		await expect(page.getByText('Index')).toBeVisible();

		deleteFile('pages/page.md');
		await waitForHMR(page);

		await expect(page.getByRole('link', { name: 'Page' })).not.toBeVisible();
		await page.goto('/page');
		await expect(page.getByText('Page Not Found')).toBeVisible();
	});
});

test.describe('sources', () => {
	test('editing should HMR', async ({ page }) => {
		await page.goto('/orders');
		await waitForPageToLoad(page);

		await expect(page.getByText('Loaded 10000 orders')).toBeVisible();

		editFile('sources/needful_things/orders.sql', (content) => `${content} limit 100`);

		// Should see toast
		await expect(page.getByText('Finished needful_things.orders')).toBeVisible();

		// Page should use new query
		await expect(page.getByText('Loaded 100 orders')).toBeVisible();
	});
});

test.describe('error handling', () => {
	test('reserved word in query name', async ({ page }) => {
		await page.goto('/error-handling/reserved-word-query-name/');

		await waitForPageToLoad(page);

		editFile('pages/error-handling/reserved-word-query-name.md', (content) =>
			content.replace('my_query', 'new')
		);

		await expect(page.getByText('"new" cannot be used as a query name')).toBeVisible();
	});
});

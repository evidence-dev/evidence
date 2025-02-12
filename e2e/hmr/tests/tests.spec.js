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

test.describe('page query HMR', () => {
	test('editing should HMR', async ({ page }) => {
		const query0 = 'select * from orders;';

		await page.goto('/orders');
		// hard reload page for queries to SSR
		await page.reload();

		await waitForPageToLoad(page);

		await expect(page.getByText('Loaded 10000 orders')).toBeVisible();

		const query1 = 'select * from orders LIMIT 500;';
		editFile('pages/orders.md', (content) => content.replace(query0, query1));
		await waitForHMR(page);
		await expect(page.getByText('Loaded 500 orders')).toBeVisible();

		const query2 = 'select * from orders LIMIT 100;';
		editFile('pages/orders.md', (content) => content.replace(query1, query2));
		await waitForHMR(page);
		await expect(page.getByText('Loaded 100 orders')).toBeVisible();

		editFile('pages/orders.md', (content) => content.replace(query2, query0));
		await waitForHMR(page);
		await expect(page.getByText('Loaded 10000 orders')).toBeVisible();
	});
});

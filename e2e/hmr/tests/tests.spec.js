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


	/*
		The following tests are skipped because of a vite behavior where a page is ineligible for
		HMR if the dev server hasn't yet transformed it. (e.g. the user hasn't opened it)

		While this isn't a behavior we want, it is enough of an edge case to not spend a lot of 
		time fixing up for now.
	*/
	test.skip('creating should add to the sidebar and allow navigation', async ({ page }) => {
		await page.goto('/');
		await waitForPageToLoad(page);

		await expect(page.getByText('Index')).toBeVisible();

		createFile('pages/new-page.md', 'This is a new page');
		// file deletions trigger full reload, so we don't waitForHMR() here

		await expect(page.getByRole('link', { name: 'New Page' })).toBeVisible();
		await page.goto('/new-page');
		await expect(page.getByText('This is a new page')).toBeVisible();
	});

	test.skip('deleting should remove from the sidebar and prevent navigation', async ({ page }) => {
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

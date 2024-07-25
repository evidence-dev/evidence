// @ts-check
import { test, expect } from '@playwright/test';
import { createFile, editFile, restoreChangedFiles } from '../../fs-utils';

test.afterAll(() => {
	restoreChangedFiles();
});

test('editing a page should HMR', async ({ page }) => {
	await page.goto('/page');
	await expect(page.getByText('This page has some text on it')).toBeVisible();

	editFile('pages/page.md', (content) => content.replace('some text', 'some different text'));

	await expect(page.getByText('This page has some different text on it')).toBeVisible();
});

test('creating a new page should add it to the sidebar and allow navigation to it', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.getByText('Index')).toBeVisible();

	createFile('pages/new-page.md', 'This is a new page');

	await expect(page.getByRole('link', { name: 'New Page' })).toBeVisible();
	await page.goto('/new-page');
	await expect(page.getByText('This is a new page')).toBeVisible();
});

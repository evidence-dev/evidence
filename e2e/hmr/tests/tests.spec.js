// @ts-check
import { test, expect } from '@playwright/test';
import { createFile, deleteFile, editFile, restoreChangedFiles } from './fs-utils';

const waitForDevModeToLoad = async (page) => {
	if (!process.env.DEV) return;

	await Promise.all([page.waitForTimeout(100), page.waitForLoadState('networkidle')]);

	await expect(page.getByTestId('#__evidence_project_splash')).not.toBeVisible();
};

test.afterEach(() => {
	restoreChangedFiles();
});

test('editing a page should HMR', async ({ page }) => {
	await page.goto('/page');
	await waitForDevModeToLoad(page);

	await expect(page.getByText('This page has some text on it')).toBeVisible();

	editFile('pages/page.md', (content) => content.replace('some text', 'some different text'));

	await expect(page.getByText('This page has some different text on it')).toBeVisible();
});

test('creating a new page should add it to the sidebar and allow navigation to it', async ({
	page
}) => {
	await page.goto('/');
	await waitForDevModeToLoad(page);

	await expect(page.getByText('Index')).toBeVisible();

	createFile('pages/new-page.md', 'This is a new page');

	await expect(page.getByRole('link', { name: 'New Page' })).toBeVisible();
	await page.goto('/new-page');
	await expect(page.getByText('This is a new page')).toBeVisible();
});

test('deleting a page should remove it from the sidebar and prevent navigation to it', async ({
	page
}) => {
	await page.goto('/');
	await waitForDevModeToLoad(page);

	await expect(page.getByText('Index')).toBeVisible();

	deleteFile('pages/page.md');

	await expect(page.getByRole('link', { name: 'Page' })).not.toBeVisible();
	await page.goto('/page');
	await expect(page.getByText('Page Not Found')).toBeVisible();
});

// @ts-check
import { test, expect } from '@playwright/test';
import { editFile, restoreChangedFiles } from '../../fs-utils';

test.afterAll(() => {
	restoreChangedFiles();
});

test('editing a page should HMR', async ({ page }) => {
	await page.goto('/page');
	await expect(page.getByText('This page has some text on it')).toBeVisible();

	editFile('pages/page.md', (content) => content.replace('some text', 'some different text'));

	await expect(page.getByText('This page has some different text on it')).toBeVisible();
});

// @ts-check

import { expect } from '@playwright/test';

export const waitForDevModeToLoad = async (page) => {
	if (!process.env.DEV) return;

	await Promise.all([page.waitForTimeout(100), page.waitForLoadState('networkidle')]);

	await expect(page.getByTestId('#__evidence_project_splash')).not.toBeVisible();
};

/** @param {import("@playwright/test").Page} page */
export function waitForWasm(page) {
	const context = page.context();
	return new Promise((res) => {
		context.route(/duckdb-eh\..*?\.wasm$/, async (route) => {
			await route.abort();
			res(undefined);
		});
	});
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
export const isKebabMenuOpen = async (page) => {
	try {
		const menu = await page.getByRole('menu', { name: 'Menu' });
		const isVisible = await menu.isVisible();
		return isVisible;
	} catch (e) {
		console.error('isKebabMenuOpen failed', e);
		throw e;
	}
};

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>} True if the kebab menu was opened, false if it was already open
 */
export const openKebabMenu = async (page) => {
	if (await isKebabMenuOpen(page)) return false;

	try {
		// Click button to open menu
		await page.getByRole('button', { name: 'Menu' }).click();
		// Make sure menu is open
		await expect(page.getByRole('menu', { name: 'Menu' })).toBeVisible();
		return true;
	} catch (e) {
		console.error('openKebabMenu failed', e);
		throw e;
	}
};

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>} True if the kebab menu was closed, false if it was already closed
 */
export const closeKebabMenu = async (page) => {
	if (!(await isKebabMenuOpen(page))) return false;

	try {
		// Click button to close menu
		await page.getByRole('button', { name: 'Menu' }).click();
		// Make sure menu is closed
		await expect(page.getByRole('menu', { name: 'Menu' })).not.toBeVisible();
		return true;
	} catch (e) {
		console.error('closeKebabMenu failed', e);
		throw e;
	}
};

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ closeKebabMenu?: boolean }} options
 * @returns {Promise<'light' | 'dark' | 'system'>}
 */
const getAppearance = async (page, options = { closeKebabMenu: true }) => {
	try {
		await openKebabMenu(page);

		const textContent = await page.getByRole('menuitem', { name: 'Appearance' }).textContent();
		const appearance = textContent?.split(/\s+/)[1].toLowerCase();
		if (!appearance || !['light', 'dark', 'system'].includes(appearance)) {
			throw new Error(`Invalid appearance ${appearance}`);
		}
		return /** @type {'light' | 'dark' | 'system'} */ (appearance);
	} catch (e) {
		console.error('getAppearance failed', e);
		throw e;
	} finally {
		if (options.closeKebabMenu) {
			await closeKebabMenu(page);
		}
	}
};

/**
 * @param {import('@playwright/test').Page} page
 * @param {'light' | 'dark' | 'system'} appearance
 */
export const switchAppearance = async (page, appearance) => {
	try {
		let current = await getAppearance(page);
		if (current === appearance) return;

		await openKebabMenu(page);
		// Switch appearance a max of 2 times (since there's 3 options)
		for (let i = 0; i < 2; i++) {
			await page.getByRole('menuitem', { name: 'Appearance' }).click();
			current = await getAppearance(page, { closeKebabMenu: false });
			if (current === appearance) break;
		}

		if (current !== appearance) {
			throw new Error(`Appearance ${current} doesnt match ${appearance} after switching`);
		}
	} catch (e) {
		console.error('switchAppearance failed', e);
		throw e;
	} finally {
		await closeKebabMenu(page);
	}
};

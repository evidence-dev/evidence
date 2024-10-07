// @ts-check
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveTitle(/Welcome to Evidence/);
});

test("Using queries on page prerenders", async ({ page }) => {
	await page.goto("/");

	// length query prerenders
	await expect(page.getByTestId("category-count")).toHaveText("4");

	// query prerenders
	await expect(page.getByTestId("category-0")).toHaveText('{"category":"Sinister Toys"}');
});

test("Dropdown options prerender", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByTestId("Dropdown-category")).toHaveText("All Categories");
	await expect(page.getByTestId("Dropdown-category2")).toHaveText("Sinister Toys");
	await expect(page.getByTestId("Dropdown-year")).toHaveText("All Years");
	await expect(page.getByTestId("Dropdown-year2")).toHaveText("2019");
});

// @ts-check
import { test, expect } from '@playwright/test';

/** @param {import("@playwright/test").BrowserContext} context */
async function waitForWasm(context) {
	return new Promise((res) => {
		context.route(/duckdb-eh\..*?\.wasm$/, async (route) => {
			await route.abort();
			res(undefined);
		});
	});
}

test('has title', async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveTitle(/Welcome to Evidence/);
});

test('queries on page prerender', async ({ page }) => {
	await page.goto('/');

	// length query prerenders
	await expect(page.getByTestId('category-count')).toHaveText('4');

	// query prerenders
	await expect(page.getByTestId('category-0')).toHaveText('{"category":"Sinister Toys"}');
});

test('queries on page prerender (right before duckdb loads)', async ({ page }) => {
	await page.goto('/');
	await waitForWasm(page.context());

	// length query prerenders
	await expect(page.getByTestId('category-count')).toHaveText('4');

	// query prerenders
	await expect(page.getByTestId('category-0')).toHaveText('{"category":"Sinister Toys"}');
});

test('dropdown options prerender', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByTestId('Dropdown-category')).toHaveText('All Categories');
	await expect(page.getByTestId('Dropdown-category2')).toHaveText('Sinister Toys');
	await expect(page.getByTestId('Dropdown-year')).toHaveText('All Years');
	await expect(page.getByTestId('Dropdown-year2')).toHaveText('2019');
});

test('dropdown options prerender (right before duckdb loads)', async ({ page }) => {
	await page.goto('/');
	await waitForWasm(page.context());

	await expect(page.getByTestId('Dropdown-category')).toHaveText('All Categories');
	await expect(page.getByTestId('Dropdown-category2')).toHaveText('Sinister Toys');
	await expect(page.getByTestId('Dropdown-year')).toHaveText('All Years');
	await expect(page.getByTestId('Dropdown-year2')).toHaveText('2019');
});

test('buildQuery without supplied initialData should be in loading state', async ({ page }) => {
	await page.goto('/');
	await waitForWasm(page.context());

	await expect(page.getByTestId('loading-1')).toHaveText('Loading...');
	await expect(page.getByTestId('loaded-1')).toHaveCount(0);
});

test('buildQuery with supplied initialData should be in loaded state', async ({ page }) => {
	await page.goto('/');
	await waitForWasm(page.context());

	await expect(page.getByTestId('loading-2')).toHaveCount(0);
	await expect(page.getByTestId('loaded-2')).toHaveText(
		'[{"category":"Sinister Toys","count":5536},{"category":"Odd Equipment","count":4966},{"category":"Mysterious Apparel","count":5186},{"category":"Cursed Sporting Goods","count":4312}]'
	);
});

// todo when DataTable is fixed: DataTable with * should be loaded on ssr

test('DataTable with buildQuery query should be loaded (right before duckdb loads)', async ({
	page
}) => {
	await page.goto('/');
	await waitForWasm(page.context());

	await expect(page.getByTestId('DataTable-ssr')).toHaveText(
		'    Category  Count     Sinister Toys5.54k   Odd Equipment4.97k   Mysterious Apparel5.19k   Cursed Sporting Goods4.31k    No Results  '
	);
});

test('DataTable with page query should be loaded (right before duckdb loads)', async ({ page }) => {
	await page.goto('/');
	await waitForWasm(page.context());

	await expect(page.getByTestId('DataTable-orders_by_category'))
		.toHaveText(`    Month  Sales Usd  Category     2021-06-01$5,903Odd Equipment   2020-11-01$5,726Odd Equipment   2021-03-01$5,551Odd Equipment   2021-11-01$5,526Odd Equipment   2021-11-01$5,515Cursed Sporting Goods   2021-10-01$5,435Odd Equipment   2019-10-01$5,345Odd Equipment   2021-09-01$5,332Odd Equipment   2020-03-01$5,252Odd Equipment   2021-07-01$5,165Odd Equipment    No Results   Page
						
						/
						15 10 of 144 records    `);
});

test('charts should render once', async ({ page }) => {
	await page.goto('/');
	await waitForWasm(page.context());

	// first BarChart imitates a chart that double loads, second is normal
	const expected = [3, 1];

	expect(
		await page.evaluate(async () => {
			const charts = window[Symbol.for('__evidence-chart-window-debug__')] ?? {};

			// wait for all charts to render
			while (Object.values(charts).some((chart) => chart.__renderCount === 0)) {
				await new Promise((res) => setTimeout(res, 100));
			}

			return Object.values(charts).map((chart) => chart.__renderCount);
		})
	).toEqual(expected);
});

import { test, expect, Page, Locator } from '@playwright/test';
import { supportLocalDev } from './local';

test.beforeEach(async ({ page }) => {
	await page.goto('/tables/data-table', supportLocalDev());
	await page.waitForTimeout(500);
});

test.describe('DataTable: New Table', () => {
	test('first table should display all rows', async ({ page }) => {
		const tables: Locator[] = await page.getByRole('table').all();
		const rows: Locator[] = await tables[0].getByRole('row').all();
		await expect(rows).toHaveLength(11);
	});

	test('second table should display all rows', async ({ page }) => {
		const tables: Locator[] = await page.getByRole('table').all();
		const rows: Locator[] = await tables[1].getByRole('row').all();
		await expect(rows).toHaveLength(11);
	});
	// test('searching in a table should filter rows', async({page}) => {
	//   const searches : Locator[] =  await page.getByPlaceholder('Search').all()
	//   await expect(searches).toHaveLength(1)
	//   await searches[0].click()
	//   await searches[0].fill('Canada')
	//   await searches[0].press('Enter')
	//   const tables : Locator[] = await page.getByRole('table').all()
	//   const filteredRows : Locator[] = await tables[0].getByRole('row').all()

	//   await expect(filteredRows).toHaveLength(2)
	// })

	// test('pressing on next page should get the next rows', async({page}) => {

	//   let secondRowText : string = await getSecondRowCountryText(page)
	//   await expect(secondRowText.trim()).toEqual('Australia')

	//   // click on next page
	//   const tableSections : Locator[] = await page.locator('.table-container').all()
	//   const allPageButtons : Locator[] = await tableSections[0].locator('.page-changer').all()

	//   await allPageButtons[2].click()
	//   // expect a different second row with new values
	//  secondRowText = await getSecondRowCountryText(page)
	//  await expect(secondRowText.trim()).toEqual('Ireland')

	// })

	/**
	 * Helper function will get the first value of the second row
	 * on the first table of the page
	 * @param page
	 * @returns
	 */
	async function getSecondRowCountryText(page: Page): Promise<string> {
		const tables: Locator[] = await page.getByRole('table').all();
		const rows: Locator[] = await tables[0].getByRole('row').all();
		// row 0 is the header
		const secondRowItems: Locator[] = await rows[2].getByRole('cell').all();
		return await secondRowItems[0].textContent();
	}
});

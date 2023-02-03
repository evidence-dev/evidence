import { test, expect, Page, Locator } from '@playwright/test';
import { supportLocalDev } from './local'

test.beforeEach(async({page})=>{
  await page.goto('/charts/area-chart', supportLocalDev())
  await page.waitForTimeout(500)
})


test.describe('Charts: Area', () => {
  test('user should get able to hide/show query and see SQL code', async ({ page }) => {
    const showQueryButton : Locator = await page.getByRole('button', { name: 'show-queries' })
    const hideQueryButton : Locator = await page.getByRole('button', { name: 'hide-queries' })
    const showSQLButton : Locator = await page.getByRole('button', { name: 'show-sql' })

    // show and hide button must be mutual exclusive
    const isHideVisible : boolean = await hideQueryButton.isVisible()
    const isShowVisible : boolean = await showQueryButton.isVisible()
    expect(isHideVisible).toEqual(!isShowVisible)

    
    // if hide query button is visible, user should be able to hide query section
    if(await hideQueryButton.isVisible()){
        await hideQueryButton.click()

        // wait for the svelte dom manipulation
        await page.waitForTimeout(500)

        // the show SQL button should not be available
        expect(await showSQLButton.isVisible()).toEqual(false)
    }

    if(await showQueryButton.isVisible()){
      await showQueryButton.click()



      // show SQL button should be visible
      await expect(showSQLButton).toBeVisible()

      // click on the show SQL button
      await showSQLButton.click()

      // wait for animation
      await page.waitForTimeout(100)
      // should see only one SQL code container
      const SQLCodeContainers : Locator[] = await page.locator("div .code-container").all()
      expect(SQLCodeContainers.length).toEqual(1)
      await expect(SQLCodeContainers[0]).toBeVisible()
    }

  });
})

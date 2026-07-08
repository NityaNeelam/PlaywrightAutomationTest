import { test, expect } from '../fixtures/test.fixture';
import { CarAppearancePage } from '../pages/carAppearance.page';
import { ShaftDimensionsPage } from '../pages/shaftDimensions.page';
import { Utils } from '../utils/Util';
import { testData } from '../utils/dataReader';

test.describe.serial('KONE Studio - Smoke Suite', () => {
  test(
    'landing modal to products page',
    { tag: ['@smoke'] },
    async ({ landingPage, productsPage, page }) => {

      // ---- Landing page ----

      await test.step('Complete landing modal', async () => {
        await Utils.assertVisible(landingPage.modalTitle, 'Landing modal');
        /* await landingPage.completeLanding(
           testData.env.landingPage.projectCountry,
           testData.env.landingPage.buildingType,
           testData.env.landingPage.role
         );*/
        const { projectCountry, buildingType, role } = testData.env.landingPage;
        await landingPage.completeLanding(projectCountry, buildingType, role);

        // reads values from env.json
        await Utils.assertHidden(landingPage.modalTitle, 'Landing modal');
      });


      // ---- Products page ----
      await test.step('Customize a product', async () => {
        // await productsPage.waitForLoaded();
        await productsPage.customizeProduct(testData.env.productPage.customizeProduct);
        await expect(page.getByText('Mono', { exact: false }).first()).toBeVisible();
        //await page.waitForURL(/#\/(customize|configure|product)/, { timeout: 20000 });
      });

      // ---- Shaft dimensions page ----
      await test.step('Configure shaft dimensions', async () => {
        const shaftDimensionsPages = new ShaftDimensionsPage(page);

        // const { floorHeightFeet, floorHeightInches, capacity, clearCarHeight } = testData.env.shaftDimensionsPage;
        // await shaftDimensionsPage.goto();

        // Configure shaft dimensions with sample data
        //await shaftDimensionsPage.setNumberOfFloors(5);
        /*  await shaftDimensionsPages.setFloorHeight(floorHeightFeet, floorHeightInches);
          await shaftDimensionsPages.selectCapacity(capacity);
          await shaftDimensionsPages.selectClearCarHeight(clearCarHeight);*/

        await shaftDimensionsPages.selectRandomForAllDropdowns();
        await shaftDimensionsPages.clickContinueToCarAppearance();
        await expect(page.getByText('Wall', { exact: false }).first()).toBeVisible();

      });

      // ---- Car appearance page ----
      /*     await test.step('Configure car appearance', async () => {
             const carAppearancePage = new CarAppearancePage(page);
             await carAppearancePage.assertOnCarAppearanceStep();
     
             const chosen = await carAppearancePage.selectRandomForAllSections();
     
             console.log('Random car appearance selections:', chosen);
             await test.info().attach('car-appearance-selections', {
               body: JSON.stringify(chosen, null, 2),
               contentType: 'application/json',
             });
     
             await carAppearancePage.clickContinueToOtherSelections();
           });*/


      await test.step('Configure car appearance', async () => {
        test.setTimeout(120_000);
        const carAppearancePage = new CarAppearancePage(page);
        await carAppearancePage.assertOnCarAppearanceStep();
        await expect(page.getByText('Wall', { exact: false }).first()).toBeVisible();
        await expect(page.locator('canvas').first()).toBeVisible({ timeout: 40_000 });

        await carAppearancePage.openAllAccordions(); // opens all 5 sections + selects dropdowns

        await carAppearancePage.clickContinueToOtherSelections();
      });
    });
});
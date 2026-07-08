import { test, expect } from '../fixtures/test.fixture';
import { CarAppearancePage } from '../pages/carAppearance.page';
import { ShaftDimensionsPage } from '../pages/shaftDimensions.page';
import { Utils } from '../utils/Util';
import { testData } from '../utils/dataReader';

test.describe.serial('KONE Studio - Smoke Suite', () => {
  test('Configure a product end to end', { tag: ['@smoke'] }, async ({
    landingPage,
    productsPage,
    page,
  }) => {
    test.setTimeout(120_000);

    const shaftDimensionsPage = new ShaftDimensionsPage(page);
    const carAppearancePage = new CarAppearancePage(page);

    const { projectCountry, buildingType, role } = testData.env.landingPage;
    const { customizeProduct } = testData.env.productPage;

    await test.step('Complete the landing modal', async () => {
      await Utils.assertVisible(landingPage.modalTitle, 'Landing modal');
      await landingPage.completeLanding(projectCountry, buildingType, role);
      await Utils.assertHidden(landingPage.modalTitle, 'Landing modal');
    });

    await test.step(`Customize "${customizeProduct}"`, async () => {
      await productsPage.customizeProduct(customizeProduct);
      await expect(page.getByText('Mono', { exact: false }).first()).toBeVisible();
    });

    await test.step('Configure shaft dimensions', async () => {
      await shaftDimensionsPage.selectRandomForAllDropdowns();
      await shaftDimensionsPage.clickContinueToCarAppearance();
      await expect(page.getByText('Wall', { exact: false }).first()).toBeVisible();
    });

    await test.step('Configure car appearance', async () => {
      await carAppearancePage.assertOnCarAppearanceStep();
      await expect(page.locator('canvas').first()).toBeVisible({ timeout: 40_000 });

      await carAppearancePage.openAllAccordions();
      await carAppearancePage.clickContinueToOtherSelections();
    });
  });
});
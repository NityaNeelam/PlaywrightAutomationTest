import { test, expect } from '../fixtures/test.fixture';
import { LandingPage } from '../pages/landing.page';
import { ProductsPage } from '../pages/product.page';
import { Utils } from '../utils/Util';
import { testData } from '../utils/dataReader';

test.describe('KONE Studio - Landing', () => {
  test(
    'should complete landing and continue',
    { tag: ['@COTC-1001'] },
    async ({ landingPage }) => {
      // Fixture already opened Studio and waited for the modal.
      await Utils.assertVisible(landingPage.modalTitle, 'Landing modal');

      await landingPage.completeLanding(
        testData.env.landingPage.projectCountry,
        testData.env.landingPage.buildingType,
        testData.env.landingPage.role
      );

      // Modal is dismissed once the questions are answered and Continue is clicked.
      await Utils.assertHidden(landingPage.modalTitle, 'Landing modal');
    }
  );
  // Using fixtures
  test(
    'should complete landing with explicit values',
    { tag: ['@COTC-1002'] },
    async ({ landingPage }) => {
      await landingPage.selectProjectCountry(testData.env.landingPage.projectCountry);
      await landingPage.selectBuildingType(testData.env.landingPage.buildingType);
      await landingPage.selectRole(testData.env.landingPage.role);
      await landingPage.clickContinue();
      await landingPage.clickStartplanning();
      await expect(landingPage.modalTitle).toBeHidden();
    }
  );
  // Using const
  test(
    'Landing page code with const',
    { tag: ['@CTOC-1003'] },
    async ({ page }) => {
      const landing = new LandingPage(page);
      await landing.open();
      await landing.completeLanding(
        testData.env.landingPage.projectCountry,
        testData.env.landingPage.buildingType,
        testData.env.landingPage.role
      );
      await Utils.assertHidden(landing.modalTitle, 'Landing modal');
    }
  );

});

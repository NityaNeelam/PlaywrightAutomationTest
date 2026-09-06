import { test, expect } from '../fixtures/test.fixture';
import { Utils } from '../utils/Util';
//import { testData } from '../utils/dataReader';
import { ProductsPage } from '../pages/product.page';
import { ShaftPage } from '../pages/shaft.page';
import testData from '../test-data/env.json';



test.describe('KONE Studio - Smoke Suite', () => {
  for (const [productName, product] of [
    ['Mono300', testData.productPage.Mono300],
    ['Mono500', testData.productPage.Mono500],
  ] as const) {
    test(`Complete landing modal ${productName}`, { tag: ['@E2E-101'] }, async ({ page, landingPage }) => {
      await landingPage.completeLanding(
        testData.landingPage.projectCountry,
        testData.landingPage.buildingType,
        testData.landingPage.role
      );
      await Utils.assertHidden(landingPage.modalTitle, 'Landing modal');

      const products = new ProductsPage(page);
      await products.waitForLoaded();
      await products.customizeProduct(product);

      const shaftPage = new ShaftPage(page);
      await shaftPage.selectRandomForAllDropdowns();
    });
  }
});

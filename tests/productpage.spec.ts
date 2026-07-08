import { test, expect } from '../fixtures/test.fixture';
import { ProductsPage } from '../pages/product.page';
import { testData } from '../utils/dataReader';

test.describe('KONE Studio - Product page', () => {
  test(
    'landing modal to products page',
    { tag: ['@QA-01'] },
    async ({ productsPage, page }) => {


      // ---- Products page ----
      const products = new ProductsPage(page);
      await products.waitForLoaded();
      await products.customizeProduct(testData.env.productPage.customizeProduct);
      await products.waitForLoaded();
      await expect(page).toHaveURL(/#\/products/);

      await productsPage.waitForLoaded();
      await productsPage.customizeProduct(testData.env.productPage.customizeProduct);

    }
  );
});
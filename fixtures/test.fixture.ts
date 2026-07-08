import { test as base, expect } from '@playwright/test';
import { LandingPage } from '../pages/landing.page';

import { ProductsPage } from '../pages/product.page';
/**
 * Extends Playwright's `test` with pre-built page objects. The landingPage
 * fixture opens Studio and waits for the modal, so tests start ready to act.
 *
 * In tests, import `test` from THIS file - not from @playwright/test directly.
 */
type Pages = {
  landingPage: LandingPage;
  productsPage: ProductsPage;
};



export const test = base.extend<Pages>({
  landingPage: async ({ page }, use) => {
    const landingPage = new LandingPage(page);
    await landingPage.open();
    await use(landingPage);
  },

  productsPage: async ({ page }, use) => {
    const productsPage = new ProductsPage(page);
    await productsPage.waitForLoaded();
    await use(productsPage);
  },
});

export { expect };

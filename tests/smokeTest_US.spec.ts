import { test, expect } from '../fixtures/test.fixture';
import { testData } from '../utils/dataReader';

const smokeMatrix = testData.env.smokeMatrix
  ? Array.isArray(testData.env.smokeMatrix)
    ? testData.env.smokeMatrix
    : [testData.env.smokeMatrix]
  : [];

for (const entry of smokeMatrix) {
  for (const product of (entry.products ?? [])) {
    test(`Smoke: ${entry.country} - ${product} @smoke`, async ({ landingPage, productsPage, page }) => {
      test.setTimeout(120_000);

      await test.step(`Landing (${entry.country})`, async () => {
        await landingPage.completeLanding(entry.country, entry.buildingType, entry.role);
      });

      await test.step(`Select ${product}`, async () => {
        await productsPage.customizeProduct(product);
      });

      // ...shaft + car steps
    });
  }
}
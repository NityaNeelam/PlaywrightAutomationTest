import { test, expect } from '../fixtures/test.fixture';
import { ShaftDimensionsPage } from '../pages/shaftDimensions.page';

const data = {
  expected: {
    totalTravel: '20 ft',
    keyCapacity: '2500 lb.',
    shaftSize: '54" w x 54" d',
  },
};

test.describe('Configure - Shaft dimensions @regression @shaftDimensions', () => {
  test.beforeEach(async ({ page }) => {
    // Deep-link to the configure screen (handles OneTrust + load wait).
    const shaftDimensionsPage = new ShaftDimensionsPage(page);
    await shaftDimensionsPage.goto();
  });

  test('configures all shaft dimension fields and advances to Car Appearance', async ({
    page,
  }) => {
    const shaftDimensionsPage = new ShaftDimensionsPage(page);

    // Configure shaft dimensions with sample data
    await shaftDimensionsPage.setNumberOfFloors(5);
    await shaftDimensionsPage.setFloorHeight('10', '0');
    await shaftDimensionsPage.selectCapacity('2500 lb.');
    await shaftDimensionsPage.selectSpeed('100 fpm');

    // Total travel is derived from floors x floor height and must reflect input.
    await expect(shaftDimensionsPage.totalTravelText).toContainText(data.expected.totalTravel);

    await shaftDimensionsPage.clickContinueToCarAppearance();

    // Advancing lands on step 2; assert the step tab rather than networkidle.
    await expect(
      page.getByRole('button', { name: /Car appearance/i })
    ).toBeVisible();
  });

  test('shows expected default key values', async ({ page }) => {
    const shaftDimensionsPage = new ShaftDimensionsPage(page);

    await shaftDimensionsPage.assertOnShaftDimensionsStep();

    await expect(shaftDimensionsPage.totalTravelText).toContainText(data.expected.totalTravel);
    await expect(shaftDimensionsPage.keyValue('Capacity')).toContainText(
      data.expected.keyCapacity
    );
    await expect(shaftDimensionsPage.keyValue('Shaft size (Elevator (w x d))')).toContainText(
      data.expected.shaftSize
    );
  });

  test('Continue to Car Appearance is available on the step', async ({ page }) => {
    const shaftDimensionsPage = new ShaftDimensionsPage(page);

    await expect(shaftDimensionsPage.continueToCarAppearanceButton).toBeVisible();
    await expect(shaftDimensionsPage.continueToCarAppearanceButton).toBeEnabled();
  });
});

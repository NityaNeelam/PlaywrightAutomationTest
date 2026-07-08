import { test, expect } from '../fixtures/test.fixture';
import { CarAppearancePage } from '../pages/carAppearance.page';

test.describe('Configure - Car appearance @regression @carAppearance', () => {
  test.beforeEach(async ({ page }) => {
    const carAppearancePage = new CarAppearancePage(page);
    await carAppearancePage.goto(); // deep-link + switch to Car appearance tab
  });

  test('opens each accordion and selects its dropdowns', async ({ page }) => {
    const carAppearancePage = new CarAppearancePage(page);
    await carAppearancePage.assertOnCarAppearanceStep();

    const chosen: Record<string, string> = {};

    // Each accordion handled by its own function, in display order.
    await test.step('User interface devices', async () => {
      Object.assign(chosen, await carAppearancePage.openUserInterfaceDevices());
    });
    await test.step('Ceiling', async () => {
      Object.assign(chosen, await carAppearancePage.openCeiling());
    });
    await test.step('Walls', async () => {
      Object.assign(chosen, await carAppearancePage.openWalls());
    });
    await test.step('Door', async () => {
      Object.assign(chosen, await carAppearancePage.openDoor());
    });
    await test.step('Handrails', async () => {
      Object.assign(chosen, await carAppearancePage.openHandrails());
    });

    // Log + attach so a random run is reproducible.
    console.log('Car appearance selections:', chosen);
    await test.info().attach('car-appearance-selections', {
      body: JSON.stringify(chosen, null, 2),
      contentType: 'application/json',
    });

    await carAppearancePage.clickContinueToOtherSelections();
    await expect(page.getByRole('button', { name: /Other/i })).toBeVisible();
  });

  test('3D preview and Continue action are available', async ({ page }) => {
    const carAppearancePage = new CarAppearancePage(page);
    await carAppearancePage.assertOnCarAppearanceStep();

    await expect(carAppearancePage.rotateButton).toBeVisible();
    await expect(carAppearancePage.continueToOtherSelectionsButton).toBeVisible();
    await expect(carAppearancePage.continueToOtherSelectionsButton).toBeEnabled();
  });
});

import { Page } from '@playwright/test';
import { LandingPage } from '../pages/landing.page';
import { testData } from '../utils/dataReader';

/**
 * Reusable landing flows. Flows import page objects and testData, and are
 * called from tests.
 */

/** Open Studio and complete landing using the default env.json values. */
export async function completeLandingAsDefault(page: Page): Promise<LandingPage> {
  const landing = new LandingPage(page);
  await landing.open();
  await landing.completeLanding(
    testData.env.landingPage.projectCountry,
    testData.env.landingPage.buildingType,
    testData.env.landingPage.role
  );
  return landing;
}

/** Open Studio and complete landing with explicit values. */
export async function completeLandingWith(
  page: Page,
  country: string,
  buildingType: string,
  role: string
): Promise<LandingPage> {
  const landing = new LandingPage(page);
  await landing.open();
  await landing.completeLanding(country, buildingType, role);
  return landing;
}

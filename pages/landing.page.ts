import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { Utils } from '../utils/Util';
import { testData } from '../utils/dataReader';

/**
 * LandingPage - the "Just a few questions before getting started!" modal on
 * https://distributors.kone.com/en/studio/tool/
 *
 * Holds locators and page-level actions only. All actions delegate to `Utils`.
 * No assertions live here (assertions belong in tests/flows).
 *
 * Selector note: locators are written against the visible labels seen in the
 * app. If the live DOM differs, adjust ONLY this file - tests and flows won't
 * change. Confirm real selectors quickly with `npm run codegen`.
 */
export class LandingPage extends BasePage {
  readonly modalTitle: Locator;
  readonly projectCountry: Locator;
  readonly buildingType: Locator;
  readonly yourRole: Locator;
  readonly continueButton: Locator;
  readonly acceptCookiesButton: Locator;
  readonly startPlanningButton: Locator;
  readonly oneTrustBanner: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.getByText('Just a few questions before getting started!');
    this.projectCountry = page.locator('//*[@id="mui-component-select-country"]');
    this.buildingType = page.locator('//*[@id="mui-component-select-KCO_RUSH_BUSINESS_TYPE"]');
    this.yourRole = page.locator('//*[@id="mui-component-select-role"]');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    // this.acceptCookiesButton = page.getByRole('button', { name: 'Accept all' });
    // in the constructor - replace the acceptCookiesButton line:
    this.acceptCookiesButton = page.locator('#onetrust-accept-btn-handler');
    this.startPlanningButton = page.locator('button', { hasText: 'Start Planning' });
    this.oneTrustBanner = page.locator('#onetrust-consent-sdk');
  }

  /** Open the Studio tool page, accept cookies, and wait for the landing modal. */
  async open(): Promise<void> {
    await this.navigate(testData.env.config.studioToolPath);
    await this.acceptCookies();
    await Utils.waitForVisible(this.modalTitle, 'Landing modal', 20000);
  }

  /**
   * Dismiss the cookie notice if it appears. The banner is not always shown
   * (e.g. once cookies are already stored), so this is best-effort and never
   * fails the test when the banner is absent.
   */
  /* async acceptCookies(): Promise<void> {
     try {
       // Wait for the banner to appear
       await this.oneTrustBanner.waitFor({ state: 'visible', timeout: 5000 });
 
       // Wait for the button to be visible
       await this.acceptCookiesButton.waitFor({ state: 'visible', timeout: 5000 });
 
       // Force click the button to dismiss banner
       await this.acceptCookiesButton.click({ force: true });
 
       // Wait for banner to disappear
       await this.oneTrustBanner.waitFor({ state: 'hidden', timeout: 8000 });
     } catch {
       // No cookie banner appeared or already dismissed - continue.
     }
   }*/
  async acceptCookies(): Promise<void> {
    try {
      await this.acceptCookiesButton.waitFor({ state: 'visible', timeout: 8000 });
      await this.acceptCookiesButton.click();
      // Wait for the whole OneTrust overlay to detach, not just the button.
      await this.page.locator('#onetrust-consent-sdk').waitFor({ state: 'hidden', timeout: 8000 });
    } catch {
      // Banner didn't appear (already accepted) - continue.
    }
  }

  async selectProjectCountry(value: string): Promise<void> {
    await Utils.selectDropdown(this.page, this.projectCountry, value, 'Project country');
  }

  async selectBuildingType(value: string): Promise<void> {
    await Utils.selectDropdown(this.page, this.buildingType, value, 'Building type');
  }

  async selectRole(value: string): Promise<void> {
    await Utils.selectDropdown(this.page, this.yourRole, value, 'Your role');
  }

  async clickContinue(): Promise<void> {
    await Utils.click(this.continueButton, 'Continue button');
  }

  async clickStartplanning(): Promise<void> {
    await Utils.click(this.startPlanningButton, 'Start planning button');
  }

  /** Fill all three dropdowns and submit the modal. */
  async completeLanding(country: string, buildingType: string, role: string): Promise<void> {
    await this.selectProjectCountry(country);
    await this.selectBuildingType(buildingType);
    await this.selectRole(role);
    await this.clickContinue();
    await this.clickStartplanning();
  }
}

import { Page } from '@playwright/test';
import { Utils } from '../utils/Util';

/**
 * BasePage - shared navigation and load helpers inherited by all pages.
 * Holds no locators of its own; concrete pages add those.
 */
export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Navigate to a path relative to the configured baseURL (or a full URL). */
  async navigate(path: string): Promise<void> {
    await Utils.navigateTo(this.page, path);
  }

  async waitForPageLoad(): Promise<void> {
    await Utils.waitForLoadState(this.page, 'domcontentloaded');
  }
}

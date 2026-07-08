import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { Utils } from '../utils/Util';

/**
 * ProductsPage - the "New project" product catalogue shown after Start Planning
 * (distributors.kone.com/en/studio/tool/#/products).
 *
 * Each product renders as a card (KONE MonoSpace 300 DX, 500 DX, 700 DX,
 * MiniSpace DX) with either a "Customize" or "Contact dealer" action.
 */
export class ProductsPage extends BasePage {
  readonly heading: Locator;
  readonly button: Locator;
  readonly backButton: Locator;
  readonly saveButton: Locator;
  readonly saveAndDownloadButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByText('New project').first();
    // this.button1 = page.getByRole('listitem').filter({ hasText: 'MonoSpace® 300 DX' }).getByRole('button', { name: 'Customize' });
    this.button = page.getByRole('button', { name: 'Customize' }).first();
    this.backButton = page.getByRole('button', { name: 'Back' });
    this.saveButton = page.getByRole('button', { name: 'Save', exact: true });
    this.saveAndDownloadButton = page.getByRole('button', { name: 'Save and download' });
  }

  /** A single product card, located by its visible title. 
  productCard(productName: string): Locator {
    // The card is the ancestor block that contains the product title.
    return this.page.locator('div', { hasText: productName }).last();
  }*/

  /** The product card whose title matches productName. */
  productCard(productName: string): Locator {
    // climb from the title to the closest ancestor that contains a button, at any depth
    return this.page
      .getByText(productName)
      .locator('xpath=ancestor::*[.//button][1]');
  }
  async waitForLoaded(): Promise<void> {
    await Utils.waitForVisible(this.heading, 'New project heading', 20000);
  }

  /** Click "Contact dealer" on a specific product card. */
  async contactDealer(productName: string): Promise<void> {
    const contact = this.productCard(productName).getByRole('button', { name: 'Contact dealer' });
    await Utils.click(contact, `Contact dealer ${productName}`);
  }

  async saveAndDownload(): Promise<void> {
    await Utils.click(this.saveAndDownloadButton, 'Save and download');
  }

  async customizeProduct(productName: string): Promise<void> {
    // const customize = this.productCard(productName).getByRole('button', { name: 'Customize' });
    // await customize.scrollIntoViewIfNeeded();
    // await Utils.click(customize, `Customize ${productName}`);

    await Utils.click(this.button, `Customize ${productName}`);
    await this.waitForLoaded();
  }





  /** Click "Customize" on a specific product card. 
  async customizeProduct(productName: string): Promise<void> {
    const customize = this.productCard(productName).getByRole('button', { name: 'Customize' });
    await Utils.click(customize, `Customize ${productName}`); 
}*/

}
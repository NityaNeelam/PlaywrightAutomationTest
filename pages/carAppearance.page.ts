import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { Utils } from '../utils/Util';

/**
 * Configure -> Step 2: Car appearance
 *
 * This step is a stack of MUI Accordion sections. Each section has its OWN
 * method that: opens the accordion (via XPath on its heading) and then selects
 * any dropdown values inside it. Sections without dropdowns simply open.
 *
 *   - User interface devices
 *   - Ceiling
 *   - Walls
 *   - Door
 *   - Handrails
 *
 * All raw Playwright calls are delegated to the static Utils class.
 */
export class CarAppearancePage extends BasePage {
  private readonly defaultProductId = 'Monospace300ENA';

  // --- Step header / tabs ---
  readonly configureHeading: Locator;
  readonly carAppearanceTab: Locator;

  // --- 3D preview ---
  readonly rotateButton: Locator;

  // --- Actions ---
  readonly continueToOtherSelectionsButton: Locator;
  readonly saveAndDownloadButton: Locator;

  constructor(page: Page) {
    super(page);

    this.configureHeading = page.getByText(/Configure\s*-\s*KONE MonoSpace/i);
    this.carAppearanceTab = page.getByRole('button', { name: /Car appearance/i });
    this.rotateButton = page.getByRole('button', { name: /Rotate/i });

    this.continueToOtherSelectionsButton = page.getByRole('button', {
      name: /Continue to Other selections/i,
    });
    this.saveAndDownloadButton = page
      .getByRole('button', { name: /Save and download/i })
      .last();
  }

  // ---------------------------------------------------------------------------
  // XPath locator helpers
  // ---------------------------------------------------------------------------

  /**
   * The AccordionSummary button for a section — the MUI summary button that
   * contains a heading whose text equals the section name.
   */
  private sectionSummary(heading: string): Locator {
    return this.page.locator(
      `xpath=//button[contains(@class,"MuiAccordionSummary-root")]` +
      `[.//*[normalize-space(text())="${heading}"]]`
    );
  }

  // ---------------------------------------------------------------------------
  // Navigation / lifecycle
  // ---------------------------------------------------------------------------

  async goto(productId: string = this.defaultProductId): Promise<void> {
    await this.page.goto(`#/products/${productId}`, { waitUntil: 'domcontentloaded' });
    await this.dismissCookieBanner();
    await Utils.waitForVisible(this.carAppearanceTab, 'Car appearance tab');
    await Utils.click(this.carAppearanceTab, 'Car appearance tab');
    await this.waitForLoaded();
  }

  async dismissCookieBanner(): Promise<void> {
    try {
      const acceptButton = this.page.getByRole('button', { name: 'Accept all' });
      await acceptButton.waitFor({ state: 'visible', timeout: 5000 });
      await acceptButton.click({ force: true });
      await acceptButton.waitFor({ state: 'hidden', timeout: 8000 });
    } catch {
      // No cookie banner appeared or already dismissed - continue.
    }
  }

  async waitForLoaded(): Promise<void> {
    await Utils.waitForVisible(this.configureHeading, 'Configure heading');
    await Utils.waitForVisible(
      this.sectionSummary('User interface devices'),
      'User interface devices section'
    );
  }

  async assertOnCarAppearanceStep(): Promise<void> {
    await expect(this.configureHeading).toBeVisible();
    await expect(this.carAppearanceTab).toBeVisible();
    await expect(this.sectionSummary('User interface devices')).toBeVisible();
  }

  // ---------------------------------------------------------------------------
  // Generic accordion mechanics (used by the per-section methods below)
  // ---------------------------------------------------------------------------

  /**
   * Opens an accordion by heading and waits for its controlled panel to show.
   * Returns the panel element id (from aria-controls) so callers can scope
   * their dropdown search to just that panel.
   */
  private async openAccordion(heading: string): Promise<string | null> {
    const summary = this.sectionSummary(heading);
    await Utils.waitForVisible(summary, `${heading} accordion header`);

    await summary.scrollIntoViewIfNeeded();


    if ((await summary.getAttribute('aria-expanded')) !== 'true') {
      // await Utils.click(summary, `${heading} accordion`);

      // force: true skips the "stable" wait that hangs while siblings animate
      await summary.click({ force: true });
      // wait for THIS section to report expanded (animation finished)
      await expect(summary).toHaveAttribute('aria-expanded', 'true', { timeout: 45_000 });

    }

    const panelId = await summary.getAttribute('aria-controls');
    if (panelId) {
      await this.page.locator(`#${panelId}`).waitFor({ state: 'visible' });
    } else {
      await this.page.waitForTimeout(5000); // fallback: no aria-controls exposed
    }
    return panelId;
  }

  /**
   * Selects a random enabled option in every dropdown found inside a panel.
   * Best-effort: if the section has no MUI select, returns {}. Guarded so a
   * non-dropdown control (swatch/radio) never fails the whole section.
   */
  private async selectDropdownsInPanel(
    panelId: string | null,
    section: string
  ): Promise<Record<string, string>> {
    const dropdownXPath =
      'xpath=.//*[@role="combobox" or @aria-haspopup="listbox" or contains(@class,"MuiSelect-select")]';

    const dropdowns = panelId
      ? this.page.locator(`#${panelId}`).locator(dropdownXPath)
      : this.page.locator(
        '//*[@role="combobox" or @aria-haspopup="listbox" or contains(@class,"MuiSelect-select")]'
      );

    const count = await dropdowns.count();
    const chosen: Record<string, string> = {};

    for (let i = 0; i < count; i++) {
      const dd = dropdowns.nth(i);
      if (!(await dd.isVisible().catch(() => false))) continue;
      try {
        chosen[`${section}[${i}]`] = await Utils.selectRandomMuiOption(
          dd,
          `${section} dropdown ${i + 1}`
        );
      } catch (error) {
        chosen[`${section}[${i}]`] = `(skipped: ${(error as Error).message.split('\n')[0]})`;
      }
    }
    return chosen;
  }

  // ---------------------------------------------------------------------------
  // Per-accordion functions (one each, as requested)
  // ---------------------------------------------------------------------------

  /** User interface devices — note: also contains Car/Hall signalization tabs. */
  async openUserInterfaceDevices(): Promise<Record<string, string>> {
    const panelId = await this.openAccordion('User interface devices');
    return this.selectDropdownsInPanel(panelId, 'User interface devices');
  }

  async openCeiling(): Promise<Record<string, string>> {
    const panelId = await this.openAccordion('Ceiling');
    return this.selectDropdownsInPanel(panelId, 'Ceiling');
  }

  async openWalls(): Promise<Record<string, string>> {
    const panelId = await this.openAccordion('Walls');
    await this.waitForLoaded();
    return this.selectDropdownsInPanel(panelId, 'Walls');

  }

  async openDoor(): Promise<Record<string, string>> {
    const panelId = await this.openAccordion('Door');

    return this.selectDropdownsInPanel(panelId, 'Door');
  }

  async openHandrails(): Promise<Record<string, string>> {
    const panelId = await this.openAccordion('Handrails');
    return this.selectDropdownsInPanel(panelId, 'Handrails');
  }

  /**
   * Thin orchestrator: calls each per-accordion function in display order and
   * merges what was chosen. (Each accordion still lives in its own method.)
   */
  async openAllAccordions(): Promise<Record<string, string>> {
    return {
      ...(await this.openUserInterfaceDevices()),
      ...(await this.openCeiling()),
      ...(await this.openWalls()),
      ...(await this.openDoor()),
      ...(await this.openHandrails()),
    };
  }

  // ---------------------------------------------------------------------------
  // 3D preview / actions
  // ---------------------------------------------------------------------------

  async rotatePreview(): Promise<void> {
    await Utils.click(this.rotateButton, 'Rotate preview');
  }

  async clickContinueToOtherSelections(): Promise<void> {
    await Utils.click(this.continueToOtherSelectionsButton, 'Continue to Other selections');
  }

  async clickSaveAndDownload(): Promise<void> {
    await Utils.click(this.saveAndDownloadButton, 'Save and download');
  }
}

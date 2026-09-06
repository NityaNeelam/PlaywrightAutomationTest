import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { Utils } from '../utils/Util';

/**
 * Configure -> Step 1: Shaft dimensions
 * URL (deep link): distributors.kone.com/en/studio/tool/#/products/<ProductId>
 *
 * This page is normally reached mid-journey (Landing -> Products -> Customize),
 * but the SPA hash route also supports deep-linking straight to the configure
 * screen, which `goto()` uses for isolated specs.
 *
 * REQUIRED Utils methods (delegated to the central Utils class):
 *   - dismissCookieBanner(): Promise<void>              // OneTrust
 *   - click(locator: Locator): Promise<void>
 *   - fill(locator: Locator, value: string): Promise<void>
 *   - selectMuiOption(trigger: Locator, option: string): Promise<void>  // two-click MUI pattern
 *   - setMuiSliderValue(slider: Locator, value: number): Promise<void>  // NEW - add to Util.ts
 *   - getText(locator: Locator): Promise<string>
 *   - waitForVisible(locator: Locator): Promise<void>
 */
export interface ShaftDimensionsData {
  expected: {
    totalTravel: string;
    keyCapacity: string;
  };
}

export class ShaftPage extends BasePage {
  private readonly defaultProductId = 'Monospace300ENA';

  // --- Step header / tabs ---
  readonly configureHeading: Locator;
  readonly shaftDimensionsTab: Locator;

  // --- Floors and Entrances ---
  readonly numberOfFloorsSlider: Locator;
  readonly floorHeightFeetInput: Locator;
  readonly floorHeightInchesInput: Locator;
  readonly carEntrancesSelect: Locator;
  readonly customizeButton: Locator;
  readonly totalTravelText: Locator;
  readonly customizeFloorsButton: Locator;

  // --- Car ---
  readonly capacitySelect: Locator;
  readonly speedSelect: Locator;
  readonly sizeSelect: Locator;
  readonly clearCarHeightSelect: Locator;

  // --- Doors ---
  readonly doorOpeningSelect: Locator;
  readonly doorWidthSelect: Locator;
  readonly doorHeightSelect: Locator;

  // Enabled ONLY when Door opening === 'Two-panel centre opening'
  readonly machineLocationSelect: Locator;

  // --- Electrical information ---
  readonly controlLocationSelect: Locator;
  readonly powerSupplySelect: Locator;
  readonly additionalPowerSupplySelect: Locator;

  // --- Actions ---
  readonly continueToCarAppearanceButton: Locator;
  readonly saveAndDownloadButton: Locator;

  constructor(page: Page) {
    super(page);

    this.configureHeading = page.getByText(/Configure\s*-\s*KONE MonoSpace/i);
    this.shaftDimensionsTab = page.getByRole('button', { name: /Shaft dimensions/i });

    // Floors and Entrances
    this.numberOfFloorsSlider = page.locator(
      'xpath=//input[@id="NoOfFloorsInput.name"]'
    );
    this.floorHeightFeetInput = page.locator(
      'xpath=(//input[@id="DIM_INTERFLOOR_HF_FT.name" or @id="InterfloorDistance_Disp_FT.name"])[1]'
    );
    this.floorHeightInchesInput = page.locator(
      'xpath=(//input[@id="DIM_INTERFLOOR_HF_FT.name" or @id="InterfloorDistance_Disp_IN.name"])[1]'
    );
    // this.carEntrancesSelect = this.comboboxByLabel('Car entrances');
    this.carEntrancesSelect = page.locator(
      'xpath=//div[@role="combobox" and @id="mui-component-select-ThroughTypeCar.name"]'
    );

    this.customizeButton = page.getByText('Customize', { exact: true });

    this.totalTravelText = page.getByText(/Total travel:/i);
    this.customizeFloorsButton = page.getByRole('button', {
      name: /Customize/i,
    });

    // Car
    // this.capacitySelect = this.comboboxByLabel('Capacity (lb.)');
    this.capacitySelect = page.locator(
      'xpath=//div[@role="combobox" and @id="mui-component-select-WGT_RATED_LOAD_Q_LB.name"]'
    );
    //this.speedSelect = this.comboboxByLabel('Speed (fpm)');
    this.speedSelect = page.locator(
      'xpath=//div[@role="combobox" and @id="mui-component-select-VAL_RATED_SPEED_FPM.name"]'
    );

    this.sizeSelect = page.locator(
      'xpath=//div[@role="combobox" and @id="mui-component-select-STANDARD_CARS_IMPERIAL.name"]'
    );
    this.clearCarHeightSelect = page.locator(
      'xpath=//div[@role="combobox" and (@id="mui-component-select-DIM_CAR_HEIGHT_CH_IN.name" or @id="mui-component-select-CAR_HEIGHT_CH_IN.name")]'
    )
      .or(this.comboboxByLabel('Car height'))
      .or(this.comboboxByLabel('Clear car height'))
      .first();

    // Doors
    //this.doorOpeningSelect = this.comboboxByLabel('Door opening');
    this.doorOpeningSelect = page.locator(
      'xpath= //div[@role="combobox" and (@id="mui-component-select-TYP_DOOR.name" or @id="mui-component-select-TYP_DOOR_NA.name")]'
    );

    //this.doorWidthSelect = this.comboboxByLabel('Door width');
    this.doorWidthSelect = page.locator(
      'xpath=//div[@role="combobox" and (@id="mui-component-select-TYP_DOOR_NA.name" or @id="mui-component-select-DIM_DOOR_WW.name")]'
    );
    //this.doorHeightSelect = this.comboboxByLabel('Door height');
    this.doorHeightSelect = page.locator(
      'xpath=//div[@role="combobox" and (@id="mui-component-select-DIM_DOOR_HH_TOTAL_IN.name" or @id="mui-component-select-DOOR_HH.name")]'
    );

    // Machine location - greyed out until Door opening === 'Two-panel centre opening'.
    // id-based first, label-based fallback (DOM-order safe) so it resolves either way.
    this.machineLocationSelect = page.locator(
      'xpath=//div[@role="combobox" and (' +
      '@id="mui-component-select-POS_MACHINE.name" or ' +
      '@id="mui-component-select-TYP_MACHINE_LOCATION.name" or ' +
      '@id="mui-component-select-MachineLocation.name")]'
    ).or(this.comboboxByLabel('Machine location'));

    // Electrical information
    this.controlLocationSelect = page.locator(
      'xpath=//div[@role="combobox" and @id="mui-component-select-POS_CONTROL_PANEL.name"]'
    ).or(this.comboboxByLabel('Control location')).first();

    // this.powerSupplySelect = this.comboboxByLabel('Power supply');
    this.powerSupplySelect = page.locator(
      'xpath = //div[@role="combobox" and @id="mui-component-select-VAL_POWER_SUPPLY_VOLTAGE.name"]'
    );
    //this.additionalPowerSupplySelect = this.comboboxByLabel('Additional power supply');
    this.additionalPowerSupplySelect = page.locator(
      'xpath = //div[@role="combobox" and @id="mui-component-select-TYP_ELEC_FEAT_APS.name"]'
    );

    // Actions
    this.continueToCarAppearanceButton = page.getByRole('button', {
      name: /Continue to Car Appearance/i,
    });
    this.saveAndDownloadButton = page
      .getByRole('button', { name: /Save and download/i })
      .last();
  }

  /**
   * Resolves the MUI combobox trigger that follows a given label in DOM order.
   * ⚠ VERIFY with `npm run codegen` against the real card DOM if a field
   * resolves to the wrong element — this row-based layout is DOM-order dependent.
   */
  /* private comboboxByLabel(labelText: string): Locator {
    return this.page.locator(
      `xpath=(//*[normalize-space(text())="${labelText}"]/following::*[@role="combobox"])[1]`
    );
  }*/
  private comboboxByLabel(labelText: string): Locator {
    return this.page.locator(
      `xpath=//*[normalize-space(text())="${labelText}"]/ancestor::*[.//*[@role="combobox"]][1]//*[@role="combobox"]`
    );
  }

  private sliderByLabel(labelText: string): Locator {
    return this.page.locator(
      `xpath=(//*[normalize-space(text())="${labelText}"]/following::*[@role="slider"])[1]`
    );
  }

  /** Deep-link straight to the configure screen for an isolated spec. */
  async goto(productId: string = this.defaultProductId): Promise<void> {
    // Uses baseURL from playwright.config.ts; domcontentloaded, never networkidle.
    await this.page.goto(`#/products/${productId}`, { waitUntil: 'domcontentloaded' });
    await this.dismissCookieBanner();
    await this.waitForLoaded();
  }

  // Individual random selects (each returns the value chosen)
  async selectRandomCarEntrances(): Promise<string> {
    return Utils.selectRandomMuiOption(this.carEntrancesSelect, 'Car entrances');
  }
  async selectRandomCapacity(): Promise<string> {
    return Utils.selectRandomMuiOption(this.capacitySelect, 'Capacity');
  }
  async selectRandomSpeed(): Promise<string> {
    return Utils.selectRandomMuiOption(this.speedSelect, 'Speed');
  }

  /**
   * Selects a random enabled option in every dropdown on the step and
   * returns a map of what was chosen (handy for Allure/logging).
   */
  async selectRandomForAllDropdowns1(): Promise<Record<string, string>> {
    return {
      carEntrances: await Utils.selectRandomMuiOption(this.carEntrancesSelect, 'Car entrances'),
      capacity: await Utils.selectRandomMuiOption(this.capacitySelect, 'Capacity'),
      // speed: await Utils.selectRandomMuiOption(this.speedSelect, 'Speed'),
      clearCarHeight: await Utils.selectRandomMuiOption(this.clearCarHeightSelect, 'Clear car height'),
      doorOpening: await Utils.selectRandomMuiOption(this.doorOpeningSelect, 'Door opening'),

      // doorWidth: await Utils.selectRandomMuiOption(this.doorWidthSelect, 'Door width'),
      // doorHeight: await Utils.selectRandomMuiOption(this.doorHeightSelect, 'Door height'),
      controlLocation: await Utils.selectRandomMuiOption(this.controlLocationSelect, 'Control location'),
      powerSupply: await Utils.selectRandomMuiOption(this.powerSupplySelect, 'Power supply'),
      additionalPowerSupply: await Utils.selectRandomMuiOption(this.additionalPowerSupplySelect, 'Additional power supply'),
    };
  }

  async selectRandomForAllDropdowns(): Promise<Record<string, string>> {



    const carEntrances = await Utils.selectRandomMuiOption(
      this.carEntrancesSelect,
      'Car entrances'
    );
    await this.page.waitForTimeout(1000);


    const capacity = await Utils.selectRandomMuiOption(
      this.capacitySelect,
      'Capacity'
    );
    await this.page.waitForTimeout(1000);


    const clearCarHeight = await Utils.selectRandomMuiOption(
      this.clearCarHeightSelect,
      'Clear car height'
    );
    await this.page.waitForTimeout(1000);


    const doorOpening = await Utils.selectRandomMuiOption(
      this.doorOpeningSelect,
      'Door opening'
    );
    await this.page.waitForTimeout(1000);


    // Machine location is enabled ONLY when Door opening === 'Two-panel centre opening'.
    // Pick a random value when the randomly chosen door opening unlocked it; otherwise skip.
    let machineLocation = '';
    const machineLocationPresent = await this.machineLocationSelect
      .first()
      .isVisible()
      .catch(() => false);
    if (machineLocationPresent && (await this.machineLocationSelect.first().isEnabled())) {
      machineLocation = await Utils.selectRandomMuiOption(
        this.machineLocationSelect.first(),
        'Machine location'
      );
      await this.page.waitForTimeout(1000);
    }


    const controlLocation = await Utils.selectRandomMuiOption(
      this.controlLocationSelect,
      'Control location'
    );
    await this.page.waitForTimeout(2000);


    const powerSupply = await Utils.selectRandomMuiOption(
      this.powerSupplySelect,
      'Power supply'
    );
    await this.page.waitForTimeout(2000);


    const additionalPowerSupply = await Utils.selectRandomMuiOption(
      this.additionalPowerSupplySelect,
      'Additional power supply'
    );
    await this.page.waitForTimeout(2000);


    return {
      carEntrances,
      capacity,
      clearCarHeight,
      doorOpening,
      ...(machineLocation ? { machineLocation } : {}),
      controlLocation,
      powerSupply,
      additionalPowerSupply,
    };
  }

  private async selectRandomDropdown(locator: Locator, elementName: string): Promise<string> {
    await Utils.selectDropdown(this.page, locator, '', elementName);
    return '';
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
    await Utils.waitForVisible(this.shaftDimensionsTab, 'Shaft dimensions tab');
    await Utils.waitForVisible(this.configureHeading, 'Configure heading');
  }

  async assertOnShaftDimensionsStep(): Promise<void> {
    await expect(this.configureHeading).toBeVisible();
    await expect(this.shaftDimensionsTab).toBeVisible();
  }

  // --- Floors and Entrances ---
  async setNumberOfFloors(value: number): Promise<void> {
    // Set slider value using arrow keys or direct value input
    const slider = this.numberOfFloorsSlider;
    await slider.focus();
    await this.page.keyboard.press('ArrowRight');
  }

  async setFloorHeight(feet: string, inches: string): Promise<void> {
    await Utils.fill(this.floorHeightFeetInput, feet, 'Floor height (feet)');
    await Utils.fill(this.floorHeightInchesInput, inches, 'Floor height (inches)');
  }

  async selectCarEntrances(option: string): Promise<void> {
    await Utils.selectDropdown(this.page, this.carEntrancesSelect, option, 'Car entrances');
  }

  async clickCustomizeFloors(): Promise<void> {
    await Utils.click(this.customizeFloorsButton, 'Customize floors and entrances');
  }

  // --- Car ---
  async selectCapacity(option: string): Promise<void> {
    await Utils.selectDropdown(this.page, this.capacitySelect, option, 'Capacity');
  }

  async selectSpeed(option: string): Promise<void> {
    await Utils.selectDropdown(this.page, this.speedSelect, option, 'Speed');
  }

  async selectClearCarHeight(option: string): Promise<void> {
    await Utils.selectDropdown(this.page, this.clearCarHeightSelect, option, 'Clear car height');
  }

  // --- Doors ---
  async selectDoorOpening(option: string): Promise<void> {
    await Utils.selectDropdown(this.page, this.doorOpeningSelect, option, 'Door opening');
  }

  async selectDoorWidth(option: string): Promise<void> {
    await Utils.selectDropdown(this.page, this.doorWidthSelect, option, 'Door width');
  }

  async selectDoorHeight(option: string): Promise<void> {
    await Utils.selectDropdown(this.page, this.doorHeightSelect, option, 'Door height');
  }

  // --- Electrical information ---
  async selectControlLocation(option: string): Promise<void> {
    await Utils.selectDropdown(this.page, this.controlLocationSelect, option, 'Control location');
  }

  async selectPowerSupply(option: string): Promise<void> {
    await Utils.selectDropdown(this.page, this.powerSupplySelect, option, 'Power supply');
  }

  async selectAdditionalPowerSupply(option: string): Promise<void> {
    await Utils.selectDropdown(this.page, this.additionalPowerSupplySelect, option, 'Additional power supply');
  }

  // --- Read-only values ---
  async getTotalTravel(): Promise<string> {
    return Utils.getText(this.totalTravelText, 'Total travel');
  }

  /**
   * Reads a value from the right-hand "Key values" panel by its row label.
   * ⚠ VERIFY panel structure with codegen — assumes value sits in the sibling
   * cell following the label cell.
   */
  keyValue(label: string): Locator {
    return this.page.locator(
      `xpath=(//*[normalize-space(text())="${label}"]/following::*[1])`
    );
  }

  async getKeyValue(label: string): Promise<string> {
    return Utils.getText(this.keyValue(label), `${label} value`);
  }

  // --- Actions ---
  async clickContinueToCarAppearance(): Promise<void> {
    await Utils.click(this.continueToCarAppearanceButton, 'Continue to Car Appearance');
  }

  async clickSaveAndDownload(): Promise<void> {
    await Utils.click(this.saveAndDownloadButton, 'Save and download');
  }

  /** Convenience assertion used by the spec after configuration. */
  async assertKeyValues(expected: ShaftDimensionsData['expected']): Promise<void> {
    await expect(this.totalTravelText).toContainText(expected.totalTravel);
    await expect(this.keyValue('Capacity')).toContainText(expected.keyCapacity);
  }
}

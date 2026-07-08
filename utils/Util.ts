import { test, expect, Locator, Page } from '@playwright/test';

/**
 * Utils - the single place for all reusable Playwright interactions.
 *
 * Every method:
 *   - Logs a step (visible in the Playwright HTML report and Allure).
 *   - Attaches a full-page screenshot to the report on failure.
 *   - Throws a descriptive error with the root cause.
 *
 * Page objects should delegate ALL raw Playwright calls to these methods and
 * never call locator.click(), page.goto(), etc. directly.
 */
export class Utils {
  /** Attach a failure screenshot to the current test (no-op outside a test). */
  private static async capture(page: Page, elementName: string): Promise<void> {
    try {
      const info = test.info();
      const buffer = await page.screenshot({ fullPage: true });
      await info.attach(`FAILURE - ${elementName}`, { body: buffer, contentType: 'image/png' });
    } catch {
      /* not inside a running test, or screenshot failed - ignore */
    }
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  static async navigateTo(page: Page, url: string): Promise<void> {
    await test.step(`Navigate to ${url}`, async () => {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
      } catch (error) {
        await this.capture(page, `navigate ${url}`);
        throw new Error(`Failed to navigate to "${url}": ${(error as Error).message}`);
      }
    });
  }

  static async click(locator: Locator, elementName: string): Promise<void> {
    await test.step(`Click ${elementName}`, async () => {
      try {
        await locator.click();
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Failed to click "${elementName}": ${(error as Error).message}`);
      }
    });
  }

  static async doubleClick(locator: Locator, elementName: string): Promise<void> {
    await test.step(`Double-click ${elementName}`, async () => {
      try {
        await locator.dblclick();
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Failed to double-click "${elementName}": ${(error as Error).message}`);
      }
    });
  }

  static async fill(locator: Locator, value: string, elementName: string): Promise<void> {
    await test.step(`Fill ${elementName} with "${value}"`, async () => {
      try {
        await locator.fill('');
        await locator.fill(value);
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Failed to fill "${elementName}": ${(error as Error).message}`);
      }
    });
  }

  /** Native <select> only. For custom dropdowns use selectDropdown(). */
  static async selectOption(locator: Locator, value: string, elementName: string): Promise<void> {
    await test.step(`Select "${value}" in ${elementName}`, async () => {
      try {
        try {
          await locator.selectOption({ label: value });
        } catch {
          await locator.selectOption(value);
        }
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Failed to select "${value}" in "${elementName}": ${(error as Error).message}`);
      }
    });
  }

  /**
   * Smart dropdown selection - handles BOTH native <select> and custom
   * (div/li/role="option") dropdowns. Falls back to a click-based selection
   * when the control is not a native select.
   */
  static async selectDropdown(
    page: Page,
    locator: Locator,
    value: string,
    elementName: string
  ): Promise<void> {
    await test.step(`Select "${value}" in ${elementName}`, async () => {
      try {
        const tag = await locator.evaluate((el) => el.tagName.toLowerCase());
        if (tag === 'select') {
          await locator.selectOption({ label: value }).catch(() => locator.selectOption(value));
          return;
        }

        // MUI combobox: open it and wait for the portal listbox to appear.
        await locator.click();
        const listbox = page.getByRole('listbox');
        await listbox.waitFor({ state: 'visible' });

        // Match the option within the open listbox (trimmed, exact text).
        const option = listbox.getByRole('option', { name: value, exact: true });
        await option.scrollIntoViewIfNeeded();
        await option.click();
      } catch (error) {
        await this.capture(page, elementName);
        throw new Error(`Failed to select "${value}" in "${elementName}": ${(error as Error).message}`);
      }
    });
  }

  static async check(locator: Locator, elementName: string): Promise<void> {
    await test.step(`Check ${elementName}`, async () => {
      try {
        await locator.check();
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Failed to check "${elementName}": ${(error as Error).message}`);
      }
    });
  }

  static async uncheck(locator: Locator, elementName: string): Promise<void> {
    await test.step(`Uncheck ${elementName}`, async () => {
      try {
        await locator.uncheck();
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Failed to uncheck "${elementName}": ${(error as Error).message}`);
      }
    });
  }

  static async hover(locator: Locator, elementName: string): Promise<void> {
    await test.step(`Hover over ${elementName}`, async () => {
      try {
        await locator.hover();
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Failed to hover over "${elementName}": ${(error as Error).message}`);
      }
    });
  }

  static async pressKey(locator: Locator, key: string, elementName: string): Promise<void> {
    await test.step(`Press "${key}" on ${elementName}`, async () => {
      try {
        await locator.press(key);
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Failed to press "${key}" on "${elementName}": ${(error as Error).message}`);
      }
    });
  }

  static async scrollIntoView(locator: Locator, elementName: string): Promise<void> {
    await test.step(`Scroll ${elementName} into view`, async () => {
      try {
        await locator.scrollIntoViewIfNeeded();
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Failed to scroll "${elementName}" into view: ${(error as Error).message}`);
      }
    });
  }

  static async uploadFile(locator: Locator, filePath: string, elementName: string): Promise<void> {
    await test.step(`Upload file to ${elementName}`, async () => {
      try {
        await locator.setInputFiles(filePath);
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Failed to upload file to "${elementName}": ${(error as Error).message}`);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  static async getText(locator: Locator, elementName: string): Promise<string> {
    return test.step(`Get text of ${elementName}`, async () => {
      try {
        return (await locator.textContent())?.trim() ?? '';
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Failed to get text of "${elementName}": ${(error as Error).message}`);
      }
    });
  }

  static async getInputValue(locator: Locator, elementName: string): Promise<string> {
    return test.step(`Get value of ${elementName}`, async () => {
      try {
        return await locator.inputValue();
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Failed to get value of "${elementName}": ${(error as Error).message}`);
      }
    });
  }

  static async getAttribute(
    locator: Locator,
    attributeName: string,
    elementName: string
  ): Promise<string | null> {
    return test.step(`Get attribute "${attributeName}" of ${elementName}`, async () => {
      try {
        return await locator.getAttribute(attributeName);
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Failed to get attribute "${attributeName}" of "${elementName}": ${(error as Error).message}`);
      }
    });
  }

  static async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  static async isEnabled(locator: Locator): Promise<boolean> {
    return locator.isEnabled();
  }

  static async isChecked(locator: Locator): Promise<boolean> {
    return locator.isChecked();
  }

  // ---------------------------------------------------------------------------
  // Waits
  // ---------------------------------------------------------------------------

  static async waitForVisible(locator: Locator, elementName: string, timeout = 15000): Promise<void> {
    await test.step(`Wait for ${elementName} to be visible`, async () => {
      try {
        await locator.waitFor({ state: 'visible', timeout });
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`"${elementName}" did not become visible: ${(error as Error).message}`);
      }
    });
  }

  static async waitForHidden(locator: Locator, elementName: string, timeout = 15000): Promise<void> {
    await test.step(`Wait for ${elementName} to be hidden`, async () => {
      try {
        await locator.waitFor({ state: 'hidden', timeout });
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`"${elementName}" did not become hidden: ${(error as Error).message}`);
      }
    });
  }

  static async waitForURL(page: Page, url: string | RegExp): Promise<void> {
    await test.step(`Wait for URL ${url}`, async () => {
      try {
        await page.waitForURL(url);
      } catch (error) {
        await this.capture(page, `URL ${url}`);
        throw new Error(`URL did not match "${url}": ${(error as Error).message}`);
      }
    });
  }

  static async waitForLoadState(
    page: Page,
    state: 'load' | 'domcontentloaded' | 'networkidle' = 'domcontentloaded'
  ): Promise<void> {
    await page.waitForLoadState(state);
  }

  /**
 * MUI Slider has no fillable input — focus the thumb (role="slider") and
 * step with arrow keys until aria-valuenow matches the target.
 */
  async setMuiSliderValue(slider: Locator, targetValue: number): Promise<void> {
    await slider.focus();
    let current = Number(await slider.getAttribute('aria-valuenow'));
    let guard = 0;
    while (current !== targetValue && guard < 200) {
      await slider.press(current < targetValue ? 'ArrowRight' : 'ArrowLeft');
      const next = Number(await slider.getAttribute('aria-valuenow'));
      if (next === current) break; // hit min/max boundary
      current = next;
      guard++;
    }
  }

  /**
 * MUI Slider has no fillable input — focus the thumb (role="slider") and
 * step with arrow keys until aria-valuenow matches the target.
 */
  static async setMuiSliderValue(
    slider: Locator,
    targetValue: number,
    elementName: string
  ): Promise<void> {
    await test.step(`Set ${elementName} slider to ${targetValue}`, async () => {
      try {
        await slider.focus();
        let current = Number(await slider.getAttribute('aria-valuenow'));
        let guard = 0;
        while (current !== targetValue && guard < 200) {
          await slider.press(current < targetValue ? 'ArrowRight' : 'ArrowLeft');
          const next = Number(await slider.getAttribute('aria-valuenow'));
          if (next === current) break; // hit min/max boundary
          current = next;
          guard++;
        }
      } catch (error) {
        await this.capture(slider.page(), elementName);
        throw new Error(`Failed to set slider "${elementName}": ${(error as Error).message}`);
      }
    });
  }

  /**
   * Opens a MUI Select and clicks a RANDOM *enabled* option.
   * Skips disabled options (aria-disabled="true" / .Mui-disabled) and any
   * text in `exclude` (e.g. a "Select..." placeholder).
   * Returns the visible text of the option chosen, for logging/assertions.
   */
  static async selectRandomMuiOption(
    trigger: Locator,
    elementName: string,
    exclude: string[] = []
  ): Promise<string> {
    return test.step(`Select a random enabled option in ${elementName}`, async () => {
      try {
        const page = trigger.page();
        await trigger.scrollIntoViewIfNeeded();
        await trigger.click();

        const listbox = page.getByRole('listbox');
        await listbox.waitFor({ state: 'visible' });

        const enabledOptions = listbox.locator(
          '[role="option"]:not([aria-disabled="true"]):not(.Mui-disabled)'
        );

        const all = await enabledOptions.all();
        const withText = await Promise.all(
          all.map(async (o) => ({ o, text: (await o.textContent())?.trim() ?? '' }))
        );
        const candidates = withText.filter(
          ({ text }) => text.length > 0 && !exclude.includes(text)
        );

        if (candidates.length === 0) {
          throw new Error('no enabled options available to select');
        }

        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        await pick.o.scrollIntoViewIfNeeded();
        await pick.o.click();
        await listbox.waitFor({ state: 'hidden' });

        await test.step(`→ chose "${pick.text}"`, async () => { });
        return pick.text;
      } catch (error) {
        await this.capture(trigger.page(), elementName);
        throw new Error(
          `Failed to select a random option in "${elementName}": ${(error as Error).message}`
        );
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Assertions (used in tests / fixtures, kept out of page objects)
  // ---------------------------------------------------------------------------

  static async assertVisible(locator: Locator, elementName: string): Promise<void> {
    await test.step(`Assert ${elementName} is visible`, async () => {
      try {
        await expect(locator).toBeVisible();
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Expected "${elementName}" to be visible: ${(error as Error).message}`);
      }
    });
  }

  static async assertHidden(locator: Locator, elementName: string): Promise<void> {
    await test.step(`Assert ${elementName} is hidden`, async () => {
      try {
        await expect(locator).toBeHidden();
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Expected "${elementName}" to be hidden: ${(error as Error).message}`);
      }
    });
  }

  static async assertText(locator: Locator, expected: string, elementName: string): Promise<void> {
    await test.step(`Assert ${elementName} contains "${expected}"`, async () => {
      try {
        await expect(locator).toContainText(expected);
      } catch (error) {
        await this.capture(locator.page(), elementName);
        throw new Error(`Expected "${elementName}" to contain "${expected}": ${(error as Error).message}`);
      }
    });
  }
}

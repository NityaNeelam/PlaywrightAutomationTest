import { defineConfig, devices } from '@playwright/test';
import { testData } from './utils/dataReader';

/**
 * All configuration lives here. The base URL is read from test-data/env.json.
 *
 * Reporters:
 *   - list                    console output
 *   - html                    Playwright HTML report
 *   - allure-playwright       Allure results (npm run allure:report)
 *   - ./utils/xray-cloud-reporter.ts   exports results to XRAY Cloud (gated by env.json)
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  timeout: 60 * 1000,
  expect: { timeout: 10 * 1000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ['./utils/xray-cloud-reporter.ts'],
  ],

  use: {
    baseURL: testData.env.config.baseURL,
    headless: false,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    // Uncomment to enable additional browsers:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],
});

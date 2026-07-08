# KONE TCoE - Playwright Test Automation Framework

A Page Object Model (POM) based Playwright framework with Allure reporting,
reusable utilities, XRAY integration, and structured test organisation - scoped
to the **KONE Studio onboarding** flow at
`https://distributors.kone.com/en/studio/tool/`.

The smoke test launches Google Chrome, opens the Studio tool, answers the
onboarding modal (**Project country**, **Building type**, **Your role**) and
clicks **Continue**.

## Project Structure

```
kone-tcoe-playwright/
├── .github/workflows/   # CI workflow
├── .vscode/             # Workspace settings
├── branding/            # Report/theme branding assets
├── fixtures/            # Playwright fixtures (inject page objects)
│   └── test.fixture.ts
├── flows/               # Reusable user-journey flows
│   └── onboarding.flow.ts
├── pages/               # Page Object Model classes
│   ├── base.page.ts
│   └── onboarding.page.ts
├── specs/               # Spec assets / legacy specs
├── test-data/           # Environment & business data (JSON)
│   └── env.json
├── tests/               # Executable test suites
│   └── smoke/onboarding.spec.ts
├── utils/               # Framework utilities
│   ├── Util.ts                 # all reusable Playwright interactions
│   ├── dataReader.ts           # centralised data access + ENC: decryption
│   ├── encrypt.ts              # CLI to produce ENC: values
│   └── xray-cloud-reporter.ts  # XRAY Cloud reporter
├── package.json
├── playwright.config.ts
└── README.md
```

`allure-report/`, `allure-results/`, `test-results/` and `playwright-report/`
are generated at run time and git-ignored.

## Setup

```bash
npm install
npx playwright install chrome
```

## Running Tests

```bash
npm test                 # run all tests, then generate + open the Allure report
npm run test:single tests/smoke/onboarding.spec.ts   # run a single file
npm run test:headed      # headed
npm run test:ui          # interactive UI mode
npm run test:debug       # debug
npx playwright test --grep "should complete onboarding"   # by title
```

## Configuration

Everything is in `playwright.config.ts`. The base URL is read from
`test-data/env.json`. Key settings: `testDir=./tests`, `fullyParallel=true`,
`retries=2` on CI / `0` locally, `trace=on-first-retry`,
`screenshot=only-on-failure`, `video=retain-on-failure`. The default project is
`chromium` using the installed Google Chrome (`channel: 'chrome'`); Firefox and
WebKit are commented out and can be enabled there.

## Test Data

Data lives in `test-data/` and is imported via the centralised `dataReader.ts`:

```ts
import { testData } from '../utils/dataReader';
const { projectCountry, buildingType, role } = testData.env.onboarding;
const baseURL = testData.env.config.baseURL;
```

Any string prefixed with `ENC:` is decrypted at runtime using the
`ENCRYPTION_KEY` environment variable (AES-256-GCM,
`ENC:<iv>:<authTag>:<ciphertext>`). Plain values pass through unchanged. To
create an encrypted value:

```bash
ENCRYPTION_KEY="your-key" npm run encrypt -- "value-to-encrypt"
```

## Framework Architecture

**Pages** (`pages/`) represent UI screens - they hold locators and page-level
actions, extend `BasePage`, and delegate every raw interaction to `Utils`. No
assertions or multi-page logic live in pages.

**Flows** (`flows/`) compose page objects and `testData` into reusable journeys
called from tests.

**Fixtures** (`fixtures/test.fixture.ts`) extend Playwright's `test` with
pre-built page objects. In tests, import `test` from the fixture - not from
`@playwright/test` directly:

```ts
import { test, expect } from '../../fixtures/test.fixture';

test('should complete onboarding', { tag: ['@COTC-1001'] }, async ({ onboardingPage }) => {
  await Utils.assertVisible(onboardingPage.modalTitle, 'Onboarding modal');
});
```

**Utils** (`utils/Util.ts`) provides all reusable Playwright interactions. Every
method logs a step (shown in Allure/HTML reports), attaches a full-page
screenshot on failure, and throws a descriptive error. Groups: Actions
(`navigateTo`, `click`, `fill`, `selectOption`, `selectDropdown`, `check`,
`hover`, `pressKey`, `scrollIntoView`, `uploadFile`, …), Getters (`getText`,
`getInputValue`, `getAttribute`, `isVisible`, `isEnabled`, `isChecked`), Waits
(`waitForVisible`, `waitForHidden`, `waitForURL`, `waitForLoadState`), and
Assertions (`assertVisible`, `assertHidden`, `assertText`).

> Dropdown note: `selectDropdown` auto-detects native `<select>` vs custom
> dropdowns, so it works whichever way KONE Studio renders the controls.

## Allure Reports

```bash
npm run allure:report     # generate + open
npm run allure:serve      # generate + serve
npm run allure:generate   # generate only
```

Reports include pass/fail status, step-by-step logs, failure screenshots, and
duration/history/retry trends that accumulate across runs.

## XRAY Integration

Results export to XRAY Cloud via `utils/xray-cloud-reporter.ts`, registered in
`playwright.config.ts`. Tests map to XRAY issues through tags:

```ts
test('...', { tag: ['@COTC-2886'] }, async () => { ... });
test('...', { tag: ['@COTC-2886', '@COTC-2887'] }, async () => { ... }); // one entry per ID
```

XRAY config lives in `test-data/env.json` under `xray` (`enabled`,
`cloudApiBase`, `projectKey`, `testExecutionKey`, `updateCondition`,
`executionName`, `failIfMissingTestKey`). Export is **disabled by default**
(`enabled: false`). Set these before enabling:

```bash
export ENCRYPTION_KEY="your-encryption-key"
export XRAY_CLIENT_ID="your-xray-client-id"
export XRAY_CLIENT_SECRET="your-xray-client-secret"
```

## Selector note

Locators in `pages/onboarding.page.ts` are written against the visible labels
(`Project country`, `Building type`, `Your role`, `Continue`). If the live DOM
differs, adjust that file only - tests and flows won't change. Confirm real
selectors with `npm run codegen`.

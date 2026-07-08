import * as fs from 'fs';
import * as path from 'path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

/**
 * Custom Playwright reporter that exports results to XRAY Cloud.
 *
 * Configuration comes from `test-data/env.json` under the `xray` key:
 *   enabled, cloudApiBase, projectKey, testExecutionKey, updateCondition,
 *   executionName, failIfMissingTestKey
 *
 * Credentials come from environment variables:
 *   XRAY_CLIENT_ID, XRAY_CLIENT_SECRET
 *
 * Test -> XRAY mapping is done with tags on each test, e.g.
 *   test('...', { tag: ['@COTC-2886'] }, async () => { ... });
 * Multiple IDs (separate tags or a single comma-separated tag) export one
 * result entry per XRAY test ID.
 *
 * The reporter is defensive: if XRAY is disabled or credentials are missing it
 * logs a notice and no-ops without failing the run.
 */

interface XrayConfig {
  enabled: boolean;
  cloudApiBase: string;
  projectKey: string;
  testExecutionKey: string;
  updateCondition: 'always' | 'onFailure' | 'onSuccess' | 'never';
  executionName: string;
  failIfMissingTestKey: boolean;
}

interface XrayResultEntry {
  testKey: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  comment: string;
  start?: string;
  finish?: string;
}

class XrayCloudReporter implements Reporter {
  private readonly config: Partial<XrayConfig>;
  private readonly results: XrayResultEntry[] = [];
  private readonly missingTagTests: string[] = [];

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): Partial<XrayConfig> {
    try {
      const envPath = path.resolve(__dirname, '..', 'test-data', 'env.json');
      const env = JSON.parse(fs.readFileSync(envPath, 'utf8'));
      return (env.xray ?? {}) as Partial<XrayConfig>;
    } catch (e) {
      console.warn(`[xray] Could not read xray config: ${(e as Error).message}`);
      return {};
    }
  }

  /** Extract @KEY-123 style ids from a test's tags (supports comma-separated). */
  private extractXrayIds(test: TestCase): string[] {
    const tags = (test.tags ?? []).map((t) => t.replace(/^@/, ''));
    const ids: string[] = [];
    for (const tag of tags) {
      for (const part of tag.split(',')) {
        const trimmed = part.trim().replace(/^@/, '');
        if (/^[A-Z][A-Z0-9]+-\d+$/.test(trimmed)) ids.push(trimmed);
      }
    }
    return ids;
  }

  private toXrayStatus(status: TestResult['status']): XrayResultEntry['status'] {
    switch (status) {
      case 'passed':
        return 'PASSED';
      case 'skipped':
        return 'SKIPPED';
      default:
        return 'FAILED';
    }
  }

  onBegin(_config: FullConfig): void {
    // no-op; kept for interface completeness
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const ids = this.extractXrayIds(test);
    if (ids.length === 0) {
      this.missingTagTests.push(test.title);
      return;
    }
    for (const testKey of ids) {
      this.results.push({
        testKey,
        status: this.toXrayStatus(result.status),
        comment: result.error ? String(result.error.message ?? result.error).slice(0, 1000) : '',
        start: result.startTime ? new Date(result.startTime).toISOString() : undefined,
        finish: result.startTime
          ? new Date(result.startTime.getTime() + result.duration).toISOString()
          : undefined,
      });
    }
  }

  private shouldExport(overallStatus: FullResult['status']): boolean {
    const cond = (this.config.updateCondition ?? 'always').toLowerCase();
    if (cond === 'never') return false;
    if (cond === 'onfailure') return overallStatus !== 'passed';
    if (cond === 'onsuccess') return overallStatus === 'passed';
    return true; // always
  }

  private async authenticate(): Promise<string> {
    const clientId = process.env.XRAY_CLIENT_ID;
    const clientSecret = process.env.XRAY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error('XRAY_CLIENT_ID / XRAY_CLIENT_SECRET are not set.');
    }
    const res = await fetch(`${this.config.cloudApiBase}/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    });
    if (!res.ok) throw new Error(`XRAY auth failed: ${res.status} ${res.statusText}`);
    // The API returns the bearer token as a quoted JSON string.
    return (await res.text()).replace(/^"|"$/g, '');
  }

  private async importResults(token: string): Promise<void> {
    const info: Record<string, string> = {
      summary: this.config.executionName || `Automated run ${new Date().toISOString()}`,
      description: 'Exported from Playwright (KONE TCoE framework).',
    };
    if (this.config.projectKey) info.project = this.config.projectKey;

    const payload: Record<string, unknown> = {
      info,
      tests: this.results,
    };
    if (this.config.testExecutionKey) payload.testExecutionKey = this.config.testExecutionKey;

    const res = await fetch(`${this.config.cloudApiBase}/import/execution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`XRAY import failed: ${res.status} ${text}`);
    console.log(`[xray] Exported ${this.results.length} result(s). Response: ${text}`);
  }

  async onEnd(result: FullResult): Promise<void> {
    const overallStatus = result.status;

    if (this.config.failIfMissingTestKey && this.missingTagTests.length > 0) {
      console.error(
        `[xray] failIfMissingTestKey is true but these tests have no XRAY tag:\n  - ${this.missingTagTests.join(
          '\n  - '
        )}`
      );
      process.exitCode = 1;
    }

    if (!this.config.enabled) {
      console.log('[xray] Export disabled (xray.enabled=false in env.json). Skipping.');
      return;
    }
    if (!this.shouldExport(overallStatus)) {
      console.log(`[xray] updateCondition="${this.config.updateCondition}" not met. Skipping export.`);
      return;
    }
    if (this.results.length === 0) {
      console.log('[xray] No tagged results to export.');
      return;
    }

    try {
      const token = await this.authenticate();
      await this.importResults(token);
    } catch (e) {
      console.error(`[xray] Export error: ${(e as Error).message}`);
    }
  }
}

export default XrayCloudReporter;

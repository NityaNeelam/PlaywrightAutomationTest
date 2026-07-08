import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Centralised test-data reader.
 *
 * - Loads every JSON file in `test-data/` and exposes it as `testData.<name>`
 *   (e.g. `test-data/env.json` -> `testData.env`, `test-data/products.json` -> `testData.products`).
 * - Any string value prefixed with `ENC:` is transparently decrypted at runtime
 *   using the `ENCRYPTION_KEY` environment variable. Plain values are passed
 *   through unchanged.
 *
 * Encrypted format (AES-256-GCM): `ENC:<ivHex>:<authTagHex>:<ciphertextHex>`
 */

const TEST_DATA_DIR = path.resolve(__dirname, '..', 'test-data');
const ENC_PREFIX = 'ENC:';

function deriveKey(secret: string): Buffer {
  // 32-byte key for AES-256 derived from the provided secret.
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

function decryptValue(value: string): string {
  const payload = value.slice(ENC_PREFIX.length);
  const [ivHex, authTagHex, cipherHex] = payload.split(':');

  if (!ivHex || !authTagHex || !cipherHex) {
    throw new Error('Malformed ENC value. Expected ENC:<iv>:<authTag>:<ciphertext>.');
  }

  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY is not set but an ENC: value was found in test data.');
  }

  const key = deriveKey(secret);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(cipherHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/** Recursively walk a parsed JSON object and decrypt any ENC: strings. */
function decryptDeep<T>(node: T): T {
  if (typeof node === 'string') {
    return (node.startsWith(ENC_PREFIX) ? decryptValue(node) : node) as unknown as T;
  }
  if (Array.isArray(node)) {
    return node.map((item) => decryptDeep(item)) as unknown as T;
  }
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      out[k] = decryptDeep(v);
    }
    return out as unknown as T;
  }
  return node;
}

function loadAll(): Record<string, any> {
  const store: Record<string, any> = {};
  if (!fs.existsSync(TEST_DATA_DIR)) return store;

  for (const file of fs.readdirSync(TEST_DATA_DIR)) {
    if (!file.endsWith('.json')) continue;
    const name = path.basename(file, '.json');
    const raw = fs.readFileSync(path.join(TEST_DATA_DIR, file), 'utf8');
    store[name] = decryptDeep(JSON.parse(raw));
  }
  return store;
}

/**
 * Typed shapes for the data this project ships with. Extend as you add files.
 */
export interface EnvData {
  config: {
    baseURL: string;
    studioToolPath: string;
  };
  landingPage: {
    projectCountry: string;
    buildingType: string;
    role: string;
  };
  productPage: {
    customizeProduct: string;
  }
  shaftDimensionsPage: {
    numberOfFloors: number;
    floorHeightFeet: string;
    floorHeightInches: string;
    carEntrances: string;
    capacity: string;
    speed: string;
    clearCarHeight: string;
    doorOpening: string;
    doorWidth: string;
    doorHeight: string;
    controlLocation: string;
    powerSupply: string;
    additionalPowerSupply: string;
    expected: {
      totalTravel: string;
      shaftSize: string;
      keyCapacity: string;
    };
  };
  smokeMatrix: {
    country: string;
    role: string;
    buildingType: string;
    products: [
      string,
      string
    ]

  };

  xray: {
    enabled: boolean;
    cloudApiBase: string;
    projectKey: string;
    testExecutionKey: string;
    updateCondition: 'always' | 'onFailure' | 'onSuccess' | 'never';
    executionName: string;
    failIfMissingTestKey: boolean;
  };
}

export interface TestData {
  env: EnvData;
  [key: string]: any;
}

export const testData: TestData = loadAll() as TestData;

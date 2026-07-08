import * as crypto from 'crypto';

/**
 * Produce an ENC: value for storing secrets in test-data JSON files.
 *
 * Usage:
 *   ENCRYPTION_KEY="my-key" npm run encrypt -- "plaintext-to-encrypt"
 *
 * Output format (AES-256-GCM): ENC:<ivHex>:<authTagHex>:<ciphertextHex>
 * Values are decrypted transparently at runtime by utils/dataReader.ts.
 */
function deriveKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

function encrypt(plaintext: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `ENC:${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

const plaintext = process.argv[2];
const secret = process.env.ENCRYPTION_KEY;

if (!plaintext) {
  console.error('Usage: npm run encrypt -- "value-to-encrypt"');
  process.exit(1);
}
if (!secret) {
  console.error('Set ENCRYPTION_KEY before running (e.g. ENCRYPTION_KEY="..." npm run encrypt -- "...")');
  process.exit(1);
}

console.log(encrypt(plaintext, secret));

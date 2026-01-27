/**
 * AES-256-GCM encryption utilities for sensitive settings.
 *
 * Uses Node.js built-in crypto module for encryption.
 * Format: iv:authTag:ciphertext (all base64 encoded)
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM recommended IV length
const AUTH_TAG_LENGTH = 16;

/**
 * Get the encryption key from environment variable.
 * Returns null if not configured (encryption disabled).
 */
function getEncryptionKey(): Buffer | null {
  const keyBase64 = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!keyBase64) {
    return null;
  }

  const key = Buffer.from(keyBase64, "base64");
  if (key.length !== 32) {
    throw new Error(
      `SETTINGS_ENCRYPTION_KEY must be exactly 32 bytes (got ${key.length}). Generate with: openssl rand -base64 32`,
    );
  }

  return key;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext (base64)
 * @throws Error if encryption key is not configured
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  if (!key) {
    throw new Error("SETTINGS_ENCRYPTION_KEY is not configured");
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

/**
 * Decrypt a ciphertext string using AES-256-GCM.
 *
 * @param ciphertext - The encrypted string in format: iv:authTag:ciphertext (base64)
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails or key is not configured
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  if (!key) {
    throw new Error("SETTINGS_ENCRYPTION_KEY is not configured");
  }

  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format: expected iv:authTag:ciphertext");
  }

  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const encrypted = Buffer.from(encryptedBase64, "base64");

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
  }
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`);
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Check if encryption is available (key is configured).
 */
export function isEncryptionConfigured(): boolean {
  return getEncryptionKey() !== null;
}

/**
 * Safely encrypt a value, returning the original if encryption is not configured.
 * Useful for graceful degradation in development environments.
 */
export function safeEncrypt(plaintext: string): string {
  if (!isEncryptionConfigured()) {
    console.warn("SETTINGS_ENCRYPTION_KEY not configured - storing value unencrypted");
    return plaintext;
  }
  return encrypt(plaintext);
}

/**
 * Safely decrypt a value, returning the original if it doesn't look encrypted.
 * Handles both encrypted (iv:tag:data format) and unencrypted values.
 */
export function safeDecrypt(value: string): string {
  // Check if value looks like encrypted format (iv:authTag:ciphertext)
  const parts = value.split(":");
  if (parts.length !== 3) {
    // Not encrypted format, return as-is
    return value;
  }

  // Try to decrypt, fall back to returning original value
  try {
    return decrypt(value);
  } catch {
    // If decryption fails, assume it's not encrypted
    return value;
  }
}

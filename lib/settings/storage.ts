/**
 * Redis storage for application settings.
 * Handles encryption/decryption of sensitive fields automatically.
 */

import { getRedis } from "@/lib/redis";
import { safeDecrypt, safeEncrypt } from "./encryption";
import type { AppSettings, GoogleSettings, NotionSettings } from "./types";
import { DEFAULT_FIELD_MAPPING, ENCRYPTED_FIELDS } from "./types";

// Storage key
const SETTINGS_KEY = "app:settings";

/**
 * Internal type for settings as stored in Redis (with encrypted fields).
 */
type StoredSettings = AppSettings;

/**
 * Encrypt sensitive fields before storing.
 */
function encryptSettings(settings: AppSettings): StoredSettings {
  const encrypted: StoredSettings = {
    ...settings,
    google: { ...settings.google },
    notion: { ...settings.notion },
  };

  // Encrypt Google sensitive fields
  for (const field of ENCRYPTED_FIELDS.google) {
    const value = settings.google[field];
    if (value) {
      // Type assertion needed for dynamic field access
      (encrypted.google as unknown as Record<string, string>)[field] = safeEncrypt(value);
    }
  }

  // Encrypt Notion sensitive fields
  for (const field of ENCRYPTED_FIELDS.notion) {
    const value = settings.notion[field];
    if (value) {
      // Type assertion needed for dynamic field access
      (encrypted.notion as unknown as Record<string, string>)[field] = safeEncrypt(value);
    }
  }

  return encrypted;
}

/**
 * Decrypt sensitive fields after reading.
 */
function decryptSettings(stored: StoredSettings): AppSettings {
  const decrypted: AppSettings = {
    ...stored,
    google: { ...stored.google },
    notion: { ...stored.notion },
  };

  // Decrypt Google sensitive fields
  for (const field of ENCRYPTED_FIELDS.google) {
    const value = stored.google[field];
    if (value) {
      // Type assertion needed for dynamic field access
      (decrypted.google as unknown as Record<string, string>)[field] = safeDecrypt(value);
    }
  }

  // Decrypt Notion sensitive fields
  for (const field of ENCRYPTED_FIELDS.notion) {
    const value = stored.notion[field];
    if (value) {
      // Type assertion needed for dynamic field access
      (decrypted.notion as unknown as Record<string, string>)[field] = safeDecrypt(value);
    }
  }

  return decrypted;
}

/**
 * Get the current settings from Redis.
 * Returns null if no settings are stored, Redis is not configured, or connection fails.
 */
export async function getSettings(): Promise<AppSettings | null> {
  const redis = getRedis();
  if (!redis) {
    return null;
  }
  try {
    const stored = await redis.get<StoredSettings>(SETTINGS_KEY);
    if (!stored) {
      return null;
    }
    return decryptSettings(stored);
  } catch (error) {
    console.error("Failed to fetch settings from Redis:", error);
    return null;
  }
}

/**
 * Save settings to Redis (replaces all settings).
 * Throws an error if Redis is not configured.
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Redis is not configured. Please set KV_REST_API_URL and KV_REST_API_TOKEN.");
  }
  const encrypted = encryptSettings(settings);
  await redis.set(SETTINGS_KEY, encrypted);
}

/**
 * Update settings (merges with existing).
 * Performs a deep merge for nested objects.
 */
export async function updateSettings(partial: Partial<AppSettings>): Promise<void> {
  const existing = await getSettings();

  const updated: AppSettings = {
    google: {
      ...(existing?.google || ({} as GoogleSettings)),
      ...partial.google,
    } as GoogleSettings,
    notion: {
      ...(existing?.notion || ({} as NotionSettings)),
      ...partial.notion,
    } as NotionSettings,
    fieldMapping: {
      ...(existing?.fieldMapping || DEFAULT_FIELD_MAPPING),
      ...partial.fieldMapping,
    },
    setupCompleted: partial.setupCompleted ?? existing?.setupCompleted ?? false,
  };

  await saveSettings(updated);
}

/**
 * Delete all settings from Redis.
 * Throws an error if Redis is not configured.
 */
export async function deleteSettings(): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Redis is not configured. Please set KV_REST_API_URL and KV_REST_API_TOKEN.");
  }
  await redis.del(SETTINGS_KEY);
}

/**
 * Check if settings exist in Redis.
 * Returns false if Redis is not configured.
 */
export async function hasSettings(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    return false;
  }
  const exists = await redis.exists(SETTINGS_KEY);
  return exists === 1;
}

/**
 * Check if setup has been completed.
 */
export async function isSetupComplete(): Promise<boolean> {
  const settings = await getSettings();
  return settings?.setupCompleted ?? false;
}

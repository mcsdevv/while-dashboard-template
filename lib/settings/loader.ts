/**
 * Unified configuration loader that reads from settings (Redis) or env vars.
 * Priority: Settings > Env vars > Defaults (for field mapping only)
 */

import { getGoogleClientConfig } from "@/lib/env";
import { ensureExtendedFieldMapping } from "./migration";
import { getSettings } from "./storage";
import type { ExtendedFieldMapping, FieldMapping } from "./types";
import { DEFAULT_EXTENDED_FIELD_MAPPING } from "./types";

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
}

export interface NotionConfig {
  apiToken: string;
  databaseId: string;
}

/**
 * Get Google Calendar configuration.
 * Client credentials come from env vars (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET).
 * Refresh token and calendar ID come from settings (stored during OAuth sign-in).
 *
 * @throws Error if configuration is not available
 */
export async function getGoogleConfig(): Promise<GoogleConfig> {
  // Get client credentials from env vars
  const clientConfig = getGoogleClientConfig();
  if (!clientConfig) {
    throw new Error(
      "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.",
    );
  }

  // Get refresh token and calendar ID from settings
  const settings = await getSettings();
  if (!settings?.google?.refreshToken) {
    throw new Error(
      "Google Calendar not connected. Please sign in with Google to grant calendar access.",
    );
  }

  return {
    clientId: clientConfig.clientId,
    clientSecret: clientConfig.clientSecret,
    refreshToken: settings.google.refreshToken,
    calendarId: settings.google.calendarId || "primary",
  };
}

/**
 * Get Notion configuration.
 * Tries settings first, falls back to env vars.
 *
 * @throws Error if configuration is not available from either source
 */
export async function getNotionConfig(): Promise<NotionConfig> {
  // Try settings first
  const settings = await getSettings();
  if (settings?.notion?.apiToken && settings?.notion?.databaseId) {
    return {
      apiToken: settings.notion.apiToken,
      databaseId: settings.notion.databaseId,
    };
  }

  // Fall back to env vars
  const apiToken = process.env.NOTION_API_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!apiToken || !databaseId) {
    throw new Error(
      "Notion configuration not found. " +
        "Either complete setup via the web UI or set NOTION_API_TOKEN and " +
        "NOTION_DATABASE_ID environment variables.",
    );
  }

  return {
    apiToken,
    databaseId,
  };
}

/**
 * Get field mapping configuration.
 * Tries settings first, falls back to defaults.
 * Auto-migrates legacy format to ExtendedFieldMapping.
 */
export async function getFieldMapping(): Promise<ExtendedFieldMapping> {
  const settings = await getSettings();
  if (settings?.fieldMapping) {
    return ensureExtendedFieldMapping(settings.fieldMapping);
  }
  return DEFAULT_EXTENDED_FIELD_MAPPING;
}

/**
 * Get legacy field mapping (property names only).
 * Temporary helper for backward compatibility until Notion client is updated.
 * @deprecated Use getFieldMapping() and access .notionPropertyName directly
 */
export async function getLegacyFieldMapping(): Promise<FieldMapping> {
  const extended = await getFieldMapping();
  return {
    title: extended.title.notionPropertyName,
    date: extended.date.notionPropertyName,
    description: extended.description.notionPropertyName,
    location: extended.location.notionPropertyName,
    gcalEventId: extended.gcalEventId.notionPropertyName,
    reminders: extended.reminders.notionPropertyName,
  };
}

/**
 * Get extended field mapping configuration with enabled/disabled flags.
 * Returns default configuration until settings migration is complete.
 */
export async function getExtendedFieldMapping(): Promise<ExtendedFieldMapping> {
  return getFieldMapping();
}

/**
 * Check if Google OAuth client is configured (env vars).
 */
export function isGoogleClientConfigured(): boolean {
  return getGoogleClientConfig() !== null;
}

/**
 * Check if Google Calendar is fully configured (client + refresh token).
 */
export async function isGoogleConfigured(): Promise<boolean> {
  try {
    await getGoogleConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if Google Calendar is connected (has refresh token, may not have calendar selected).
 */
export async function isGoogleConnected(): Promise<boolean> {
  if (!isGoogleClientConfigured()) return false;
  const settings = await getSettings();
  return Boolean(settings?.google?.refreshToken);
}

/**
 * Check if Notion is configured (from either source).
 */
export async function isNotionConfigured(): Promise<boolean> {
  try {
    await getNotionConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if both services are configured.
 */
export async function isFullyConfigured(): Promise<boolean> {
  const [google, notion] = await Promise.all([isGoogleConfigured(), isNotionConfigured()]);
  return google && notion;
}

/**
 * Setup API - Status
 * GET: Get current setup status
 */

import { env, getGoogleClientConfig } from "@/lib/env";
import { isRedisConfigured } from "@/lib/redis";
import { getSettings, isSetupComplete } from "@/lib/settings";
import { NextResponse } from "next/server";

/**
 * GET - Get setup status
 */
export async function GET() {
  try {
    const settings = await getSettings();
    const setupComplete = await isSetupComplete();
    const googleClientConfig = getGoogleClientConfig();

    const hasSettingsToken = !!settings?.notion?.apiToken;
    const hasSettingsDatabase = !!settings?.notion?.databaseId;
    const hasEnvToken = !!env.NOTION_API_TOKEN;
    const hasEnvDatabase = !!env.NOTION_DATABASE_ID;
    const notionConfigured = hasSettingsToken || hasEnvToken;
    const notionDatabaseSelected =
      (hasSettingsToken && hasSettingsDatabase) || (hasEnvToken && hasEnvDatabase);

    return NextResponse.json({
      setupComplete,
      storage: {
        configured: isRedisConfigured(),
      },
      google: {
        // Client credentials are configured via env vars
        configured: googleClientConfig !== null,
        // Connected when we have a refresh token from OAuth sign-in
        connected: !!settings?.google?.refreshToken,
        calendarSelected: !!settings?.google?.calendarId,
        connectedAt: settings?.google?.connectedAt || null,
        oauthAppPublished: settings?.google?.oauthAppPublished || false,
      },
      notion: {
        configured: notionConfigured,
        databaseSelected: notionDatabaseSelected,
        databaseName: settings?.notion?.databaseName || null,
        hasEnvToken: hasEnvToken && !hasSettingsToken,
      },
      fieldMapping: {
        configured: !!settings?.fieldMapping,
      },
    });
  } catch (error) {
    console.error("Error getting setup status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get status" },
      { status: 500 },
    );
  }
}

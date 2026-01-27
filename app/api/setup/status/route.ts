/**
 * Setup API - Status
 * GET: Get current setup status
 */

import { getGoogleClientConfig } from "@/lib/env";
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

    return NextResponse.json({
      setupComplete,
      google: {
        // Client credentials are configured via env vars
        configured: googleClientConfig !== null,
        // Connected when we have a refresh token from OAuth sign-in
        connected: !!settings?.google?.refreshToken,
        calendarSelected: !!settings?.google?.calendarId,
        connectedAt: settings?.google?.connectedAt || null,
      },
      notion: {
        configured: !!settings?.notion?.apiToken,
        databaseSelected: !!settings?.notion?.databaseId,
        databaseName: settings?.notion?.databaseName || null,
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

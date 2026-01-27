/**
 * Settings API
 * GET: Get current settings (with sensitive fields masked)
 * PUT: Update settings (field mapping only)
 */

import { getGoogleClientConfig } from "@/lib/env";
import { getSettings, updateSettings } from "@/lib/settings";
import type { FieldMapping } from "@/lib/settings/types";
import { NextResponse } from "next/server";

/**
 * GET - Get current settings with sensitive fields masked
 */
export async function GET() {
  try {
    const settings = await getSettings();
    const googleClientConfig = getGoogleClientConfig();

    if (!settings) {
      return NextResponse.json({
        google: {
          isConfigured: googleClientConfig !== null,
          isConnected: false,
          calendarId: null,
          calendarName: null,
          connectedAt: null,
        },
        notion: null,
        fieldMapping: null,
        setupCompleted: false,
      });
    }

    return NextResponse.json({
      google: {
        // Client credentials come from env vars
        isConfigured: googleClientConfig !== null,
        isConnected: !!settings.google?.refreshToken,
        calendarId: settings.google?.calendarId || null,
        calendarName: settings.google?.calendarName || null,
        connectedAt: settings.google?.connectedAt || null,
      },
      notion: settings.notion
        ? {
            databaseId: settings.notion.databaseId || null,
            databaseName: settings.notion.databaseName || null,
            isConnected: !!settings.notion.apiToken,
          }
        : null,
      fieldMapping: settings.fieldMapping || null,
      setupCompleted: settings.setupCompleted,
    });
  } catch (error) {
    console.error("Error getting settings:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get settings" },
      { status: 500 },
    );
  }
}

/**
 * PUT - Update settings (only field mapping allowed via this endpoint)
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Only allow updating field mapping through this endpoint
    // Credentials should be updated through the setup flow
    if (body.fieldMapping) {
      const fieldMapping: FieldMapping = {
        title: body.fieldMapping.title,
        date: body.fieldMapping.date,
        description: body.fieldMapping.description,
        location: body.fieldMapping.location,
        gcalEventId: body.fieldMapping.gcalEventId,
        reminders: body.fieldMapping.reminders,
      };

      await updateSettings({ fieldMapping });
    }

    const settings = await getSettings();

    return NextResponse.json({
      success: true,
      fieldMapping: settings?.fieldMapping || null,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 500 },
    );
  }
}

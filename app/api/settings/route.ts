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
        oauthAppPublished: settings.google?.oauthAppPublished || false,
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
 * PUT - Update settings (field mapping and oauthAppPublished allowed via this endpoint)
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updates: Parameters<typeof updateSettings>[0] = {};

    // Allow updating field mapping
    if (body.fieldMapping) {
      updates.fieldMapping = {
        title: body.fieldMapping.title,
        date: body.fieldMapping.date,
        description: body.fieldMapping.description,
        location: body.fieldMapping.location,
        gcalEventId: body.fieldMapping.gcalEventId,
        reminders: body.fieldMapping.reminders,
      };
    }

    // Allow updating oauthAppPublished flag
    if (typeof body.oauthAppPublished === "boolean") {
      // updateSettings does a deep merge, so we only need to provide the field to update
      updates.google = { oauthAppPublished: body.oauthAppPublished } as Parameters<
        typeof updateSettings
      >[0]["google"];
    }

    if (Object.keys(updates).length > 0) {
      await updateSettings(updates);
    }

    const settings = await getSettings();

    return NextResponse.json({
      success: true,
      fieldMapping: settings?.fieldMapping || null,
      oauthAppPublished: settings?.google?.oauthAppPublished || false,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 500 },
    );
  }
}

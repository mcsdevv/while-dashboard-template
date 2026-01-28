/**
 * Setup API - List Google Calendars
 * GET: List available calendars for selection
 * POST: Select a calendar to sync
 */

import { getGoogleClientConfig } from "@/lib/env";
import { resetGcalClient } from "@/lib/google-calendar/client";
import { getSettings, updateSettings } from "@/lib/settings";
import { calendar } from "@googleapis/calendar";
import { OAuth2Client } from "google-auth-library";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * GET - List available calendars
 */
export async function GET() {
  try {
    // Get client credentials from env vars
    const clientConfig = getGoogleClientConfig();
    if (!clientConfig) {
      return NextResponse.json(
        {
          error: "Google OAuth not configured",
          details:
            "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel → Settings → Environment Variables, then redeploy.",
          code: "NOT_CONFIGURED",
        },
        { status: 400 },
      );
    }

    // Get refresh token from settings
    const settings = await getSettings();
    if (!settings?.google?.refreshToken) {
      return NextResponse.json(
        {
          error: "Google not connected",
          details: "Please sign in with Google first to authorize calendar access.",
          code: "NOT_CONNECTED",
        },
        { status: 400 },
      );
    }

    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(clientConfig.clientId, clientConfig.clientSecret);
    oauth2Client.setCredentials({ refresh_token: settings.google.refreshToken });

    // Get calendar list
    const calendarClient = calendar({ version: "v3", auth: oauth2Client });

    try {
      const calendarList = await calendarClient.calendarList.list();

      const calendars = (calendarList.data.items || []).map((cal) => ({
        id: cal.id || "",
        name: cal.summary || "",
        primary: cal.primary || false,
        accessRole: cal.accessRole || "",
      }));

      return NextResponse.json({
        calendars,
        selectedCalendarId: settings.google.calendarId,
      });
    } catch (calendarError) {
      // Handle specific Google API errors
      const errorMessage = calendarError instanceof Error ? calendarError.message : "Unknown error";

      if (
        errorMessage.includes("invalid_grant") ||
        errorMessage.includes("Token has been expired")
      ) {
        return NextResponse.json(
          {
            error: "OAuth token expired",
            details:
              "Your Google authorization has expired. This happens every 7 days in testing mode. Please sign in again to re-authorize.",
            code: "TOKEN_EXPIRED",
          },
          { status: 401 },
        );
      }

      if (errorMessage.includes("invalid_client")) {
        return NextResponse.json(
          {
            error: "Invalid OAuth credentials",
            details:
              "Your GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET may have changed. Update them in Vercel → Settings → Environment Variables.",
            code: "INVALID_CLIENT",
          },
          { status: 401 },
        );
      }

      if (errorMessage.includes("access_denied") || errorMessage.includes("forbidden")) {
        return NextResponse.json(
          {
            error: "Calendar access denied",
            details:
              "The Google Calendar API may not be enabled, or permissions were revoked. Check Google Cloud Console → APIs & Services → Calendar API.",
            code: "ACCESS_DENIED",
          },
          { status: 403 },
        );
      }

      throw calendarError;
    }
  } catch (error) {
    console.error("Error listing calendars:", error);
    return NextResponse.json(
      {
        error: "Failed to list calendars",
        details:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Check the server logs for details.",
        code: "UNKNOWN_ERROR",
      },
      { status: 500 },
    );
  }
}

const selectCalendarSchema = z.object({
  calendarId: z.string().min(1, "Calendar ID is required"),
  calendarName: z.string().optional(),
});

/**
 * POST - Select a calendar
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = selectCalendarSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.errors },
        { status: 400 },
      );
    }

    const settings = await getSettings();
    if (!settings?.google) {
      return NextResponse.json({ error: "Google not connected" }, { status: 400 });
    }

    let warning: string | undefined;
    try {
      await updateSettings({
        google: {
          ...settings.google,
          calendarId: result.data.calendarId,
          calendarName: result.data.calendarName,
        },
      });
    } catch (settingsError) {
      console.error("Failed to save settings:", settingsError);
      const isRedisError =
        settingsError instanceof Error && settingsError.message.includes("Redis is not configured");
      if (!isRedisError) {
        throw settingsError;
      }
      warning =
        "Storage not configured. Calendar selection won't be saved until storage is set up.";
    }

    // Reset cached client so it picks up new calendar ID
    resetGcalClient();

    return NextResponse.json({
      status: "success",
      calendarId: result.data.calendarId,
      calendarName: result.data.calendarName,
      ...(warning ? { warning } : {}),
    });
  } catch (error) {
    console.error("Error selecting calendar:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to select calendar" },
      { status: 500 },
    );
  }
}

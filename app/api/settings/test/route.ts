/**
 * Settings API - Test Connections
 * POST: Test Google Calendar and Notion connections
 *
 * Unlike the setup test route, this does NOT modify setupCompleted status.
 */

import { getGoogleClientConfig } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import { calendar } from "@googleapis/calendar";
import { Client } from "@notionhq/client";
import { OAuth2Client } from "google-auth-library";
import { NextResponse } from "next/server";

interface TestResult {
  service: "Google Calendar" | "Notion";
  success: boolean;
  message: string;
  details?: string;
}

/**
 * POST - Test all connections
 */
export async function POST() {
  const results: TestResult[] = [];

  try {
    const settings = await getSettings();

    // Test Google Calendar
    const googleResult = await testGoogleConnection(settings);
    results.push(googleResult);

    // Test Notion
    const notionResult = await testNotionConnection(settings);
    results.push(notionResult);

    const allPassed = results.every((r) => r.success);

    return NextResponse.json({
      allPassed,
      results,
    });
  } catch (error) {
    console.error("Error testing connections:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to test connections",
        results,
      },
      { status: 500 },
    );
  }
}

async function testGoogleConnection(
  settings: Awaited<ReturnType<typeof getSettings>>,
): Promise<TestResult> {
  // Check for client credentials from env vars
  const clientConfig = getGoogleClientConfig();
  if (!clientConfig) {
    return {
      service: "Google Calendar",
      success: false,
      message: "Not configured",
      details: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not set",
    };
  }

  if (!settings?.google?.refreshToken) {
    return {
      service: "Google Calendar",
      success: false,
      message: "Not connected",
      details: "Please sign in with Google",
    };
  }

  if (!settings.google.calendarId) {
    return {
      service: "Google Calendar",
      success: false,
      message: "No calendar selected",
      details: "Please select a calendar",
    };
  }

  try {
    const oauth2Client = new OAuth2Client(clientConfig.clientId, clientConfig.clientSecret);
    oauth2Client.setCredentials({ refresh_token: settings.google.refreshToken });

    const calendarClient = calendar({ version: "v3", auth: oauth2Client });

    const calendarInfo = await calendarClient.calendars.get({
      calendarId: settings.google.calendarId,
    });

    return {
      service: "Google Calendar",
      success: true,
      message: "Connected",
      details: `Calendar: ${calendarInfo.data.summary}`,
    };
  } catch (error) {
    console.error("Google connection test failed:", error);
    return {
      service: "Google Calendar",
      success: false,
      message: "Connection failed",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testNotionConnection(
  settings: Awaited<ReturnType<typeof getSettings>>,
): Promise<TestResult> {
  if (!settings?.notion?.apiToken) {
    return {
      service: "Notion",
      success: false,
      message: "Not configured",
      details: "API token not set",
    };
  }

  if (!settings.notion.databaseId) {
    return {
      service: "Notion",
      success: false,
      message: "No database selected",
      details: "Please select a database",
    };
  }

  try {
    const notion = new Client({ auth: settings.notion.apiToken });

    const database = await notion.databases.retrieve({
      database_id: settings.notion.databaseId,
    });

    const dbName =
      "title" in database
        ? (database.title as Array<{ plain_text: string }>)?.[0]?.plain_text || "Untitled"
        : "Untitled";

    return {
      service: "Notion",
      success: true,
      message: "Connected",
      details: `Database: ${dbName}`,
    };
  } catch (error) {
    console.error("Notion connection test failed:", error);
    return {
      service: "Notion",
      success: false,
      message: "Connection failed",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

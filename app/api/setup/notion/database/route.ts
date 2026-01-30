/**
 * Setup API - Notion Database Selection
 * POST: Save selected database and fetch schema for field mapping
 */

import { env } from "@/lib/env";
import { getSettings, updateSettings } from "@/lib/settings";
import { Client } from "@notionhq/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const databaseSelectSchema = z.object({
  databaseId: z.string().min(1, "Database ID is required"),
  apiToken: z.string().min(1).optional(),
});

/**
 * POST - Save selected database and return schema
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = databaseSelectSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const { databaseId, apiToken } = result.data;

    // Get stored Notion token
    const settings = await getSettings();
    const notionToken = settings?.notion?.apiToken ?? apiToken ?? env.NOTION_API_TOKEN;
    if (!notionToken) {
      return NextResponse.json({ error: "Notion not connected" }, { status: 400 });
    }

    // Fetch database schema
    const notion = new Client({ auth: notionToken });

    try {
      const database = await notion.databases.retrieve({ database_id: databaseId });

      // Extract property information for field mapping
      const properties = Object.entries(database.properties).map(([name, prop]) => ({
        name,
        type: prop.type,
        id: prop.id,
      }));

      // Get database name
      const databaseName =
        "title" in database
          ? (database.title as Array<{ plain_text: string }>)?.[0]?.plain_text || "Untitled"
          : "Untitled";

      // Save database selection
      let warning: string | undefined;
      try {
        await updateSettings({
          notion: {
            ...(settings?.notion ?? {}),
            apiToken: notionToken,
            databaseId,
            databaseName,
          },
        });
      } catch (settingsError) {
        console.error("Failed to save settings:", settingsError);
        const isRedisError =
          settingsError instanceof Error &&
          settingsError.message.includes("Redis is not configured");
        if (!isRedisError) {
          throw settingsError;
        }
        warning =
          "Storage not configured. Database selection won't be saved until storage is set up.";
      }

      return NextResponse.json({
        status: "success",
        database: {
          id: databaseId,
          name: databaseName,
          properties,
        },
        ...(warning ? { warning } : {}),
      });
    } catch (notionError) {
      console.error("Error fetching database:", notionError);
      return NextResponse.json(
        { error: "Failed to access database. Make sure it's shared with the integration." },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error selecting database:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to select database" },
      { status: 500 },
    );
  }
}

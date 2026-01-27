/**
 * Settings API - Field Mapping
 * GET: Get current field mapping with available Notion properties
 * PUT: Update field mapping
 */

import { DEFAULT_FIELD_MAPPING, getSettings, updateSettings } from "@/lib/settings";
import type { FieldMapping } from "@/lib/settings/types";
import { Client } from "@notionhq/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const fieldMappingSchema = z.object({
  title: z.string().min(1, "Title field is required"),
  date: z.string().min(1, "Date field is required"),
  description: z.string().optional().default(""),
  location: z.string().optional().default(""),
  gcalEventId: z.string().optional().default(""),
  reminders: z.string().optional().default(""),
});

/**
 * GET - Get current field mapping with Notion properties for editing
 */
export async function GET() {
  try {
    const settings = await getSettings();

    if (!settings) {
      return NextResponse.json({
        mapping: DEFAULT_FIELD_MAPPING,
        notionProperties: [],
        defaults: DEFAULT_FIELD_MAPPING,
      });
    }

    // Fetch Notion properties if connected
    let notionProperties: Array<{ id: string; name: string; type: string }> = [];

    if (settings.notion?.apiToken && settings.notion?.databaseId) {
      try {
        const notion = new Client({ auth: settings.notion.apiToken });
        const database = await notion.databases.retrieve({
          database_id: settings.notion.databaseId,
        });

        notionProperties = Object.entries(database.properties).map(([name, prop]) => ({
          name,
          type: prop.type,
          id: prop.id,
        }));
      } catch (error) {
        console.error("Error fetching Notion properties:", error);
        // Continue without properties - user can still see current mapping
      }
    }

    return NextResponse.json({
      mapping: settings.fieldMapping || DEFAULT_FIELD_MAPPING,
      notionProperties,
      defaults: DEFAULT_FIELD_MAPPING,
    });
  } catch (error) {
    console.error("Error getting field mapping:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get field mapping" },
      { status: 500 },
    );
  }
}

/**
 * PUT - Update field mapping
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = fieldMappingSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const fieldMapping: FieldMapping = result.data;
    await updateSettings({ fieldMapping });

    return NextResponse.json({
      success: true,
      mapping: fieldMapping,
    });
  } catch (error) {
    console.error("Error updating field mapping:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update field mapping" },
      { status: 500 },
    );
  }
}

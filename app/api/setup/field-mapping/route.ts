/**
 * Setup API - Field Mapping
 * GET: Get current field mapping (ExtendedFieldMapping format) with Notion properties
 * POST: Save field mapping configuration
 */

import {
  DEFAULT_EXTENDED_FIELD_MAPPING,
  ensureExtendedFieldMapping,
  getSettings,
  updateSettings,
} from "@/lib/settings";
import type { ExtendedFieldMapping, FieldConfig } from "@/lib/settings/types";
import { Client } from "@notionhq/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for a single field config
const fieldConfigSchema = z.object({
  enabled: z.boolean(),
  notionPropertyName: z.string(),
  displayLabel: z.string(),
  propertyType: z.enum(["title", "rich_text", "number", "date", "checkbox"]),
  required: z.boolean(),
});

// Schema for ExtendedFieldMapping
const extendedFieldMappingSchema = z.object({
  title: fieldConfigSchema,
  date: fieldConfigSchema,
  description: fieldConfigSchema,
  location: fieldConfigSchema,
  gcalEventId: fieldConfigSchema,
  reminders: fieldConfigSchema,
  attendees: fieldConfigSchema,
  organizer: fieldConfigSchema,
  conferenceLink: fieldConfigSchema,
  recurrence: fieldConfigSchema,
  color: fieldConfigSchema,
  visibility: fieldConfigSchema,
});

/**
 * GET - Get current field mapping with Notion properties for editing
 */
export async function GET() {
  try {
    const settings = await getSettings();

    // Convert to ExtendedFieldMapping format (handles legacy migration)
    const fieldMapping: ExtendedFieldMapping = settings?.fieldMapping
      ? ensureExtendedFieldMapping(settings.fieldMapping)
      : DEFAULT_EXTENDED_FIELD_MAPPING;

    // Fetch Notion properties if connected
    let notionProperties: Array<{ id: string; name: string; type: string }> = [];

    if (settings?.notion?.apiToken && settings?.notion?.databaseId) {
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
      fieldMapping,
      notionProperties,
      defaults: DEFAULT_EXTENDED_FIELD_MAPPING,
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
 * POST - Save field mapping
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = extendedFieldMappingSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const fieldMapping = result.data as ExtendedFieldMapping;

    // Validate required fields are enabled
    if (!fieldMapping.title.enabled || !fieldMapping.date.enabled) {
      return NextResponse.json({ error: "Title and Date fields must be enabled" }, { status: 400 });
    }

    // Validate required fields have property names
    if (!fieldMapping.title.notionPropertyName || !fieldMapping.date.notionPropertyName) {
      return NextResponse.json(
        { error: "Title and Date fields require Notion property names" },
        { status: 400 },
      );
    }

    await updateSettings({
      fieldMapping: fieldMapping as unknown as import("@/lib/settings/types").FieldMapping,
    });

    return NextResponse.json({
      status: "success",
      fieldMapping,
    });
  } catch (error) {
    console.error("Error saving field mapping:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save field mapping" },
      { status: 500 },
    );
  }
}

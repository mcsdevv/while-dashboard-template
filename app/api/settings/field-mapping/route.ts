/**
 * Settings API - Field Mapping
 * GET: Get current field mapping (ExtendedFieldMapping format) with Notion properties
 * PUT: Update field mapping
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
  propertyType: z.enum(["title", "rich_text", "number", "date", "checkbox", "url", "select"]),
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
      mapping: fieldMapping,
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
 * PUT - Update field mapping
 */
export async function PUT(request: NextRequest) {
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
    if (
      !fieldMapping.title.notionPropertyName.trim() ||
      !fieldMapping.date.notionPropertyName.trim()
    ) {
      return NextResponse.json(
        { error: "Title and Date fields require Notion property names" },
        { status: 400 },
      );
    }

    // Validate enabled fields have property names
    const missingEnabledFields = Object.entries(fieldMapping)
      .filter(([, config]) => {
        const fieldConfig = config as FieldConfig;
        const isEnabled = fieldConfig.required || fieldConfig.enabled;
        return isEnabled && !fieldConfig.notionPropertyName.trim();
      })
      .map(([, config]) => (config as FieldConfig).displayLabel);

    if (missingEnabledFields.length > 0) {
      return NextResponse.json(
        {
          error: `Enabled fields require Notion property names: ${missingEnabledFields.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate no duplicate Notion property mappings
    const propertyUsage = new Map<string, string[]>();
    for (const [, config] of Object.entries(fieldMapping)) {
      const fieldConfig = config as FieldConfig;
      const isEnabled = fieldConfig.enabled || fieldConfig.required;
      const propName = fieldConfig.notionPropertyName.trim();
      if (!isEnabled || !propName) continue;

      const existing = propertyUsage.get(propName) || [];
      propertyUsage.set(propName, [...existing, fieldConfig.displayLabel]);
    }

    const duplicates = [...propertyUsage.entries()].filter(([, fields]) => fields.length > 1);
    if (duplicates.length > 0) {
      const [propName, fields] = duplicates[0];
      return NextResponse.json(
        {
          error: `Cannot map multiple fields to the same Notion property. "${propName}" is used by: ${fields.join(", ")}`,
        },
        { status: 400 },
      );
    }

    await updateSettings({ fieldMapping });

    return NextResponse.json({
      success: true,
      fieldMapping,
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

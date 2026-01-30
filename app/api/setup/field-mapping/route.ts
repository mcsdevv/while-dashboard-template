/**
 * Setup API - Field Mapping
 * GET: Get current field mapping (ExtendedFieldMapping format) with Notion properties
 * POST: Save field mapping configuration
 */

import { env } from "@/lib/env";
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

    const settingsToken = settings?.notion?.apiToken;
    const settingsDatabaseId = settings?.notion?.databaseId;
    const envToken = env.NOTION_API_TOKEN;
    const envDatabaseId = env.NOTION_DATABASE_ID;

    let notionToken: string | undefined;
    let notionDatabaseId: string | undefined;

    if (settingsToken && settingsDatabaseId) {
      notionToken = settingsToken;
      notionDatabaseId = settingsDatabaseId;
    } else if (envToken && envDatabaseId) {
      notionToken = envToken;
      notionDatabaseId = envDatabaseId;
    }

    if (notionToken && notionDatabaseId) {
      try {
        const notion = new Client({ auth: notionToken });
        const database = await notion.databases.retrieve({
          database_id: notionDatabaseId,
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

    // Validate no duplicate Notion property mappings
    const propertyUsage = new Map<string, string[]>();
    for (const [fieldKey, config] of Object.entries(fieldMapping)) {
      const fieldConfig = config as FieldConfig;
      const isEnabled = fieldConfig.enabled || fieldConfig.required;
      if (!isEnabled || !fieldConfig.notionPropertyName) continue;

      const propName = fieldConfig.notionPropertyName;
      const existing = propertyUsage.get(propName) || [];
      propertyUsage.set(propName, [...existing, fieldConfig.displayLabel]);
    }

    const duplicates = [...propertyUsage.entries()].filter(([_, fields]) => fields.length > 1);
    if (duplicates.length > 0) {
      const [propName, fields] = duplicates[0];
      return NextResponse.json(
        {
          error: `Cannot map multiple fields to the same Notion property. "${propName}" is used by: ${fields.join(", ")}`,
        },
        { status: 400 },
      );
    }

    let warning: string | undefined;
    try {
      await updateSettings({
        fieldMapping: fieldMapping as unknown as import("@/lib/settings/types").FieldMapping,
      });
    } catch (settingsError) {
      console.error("Failed to save settings:", settingsError);
      const isRedisError =
        settingsError instanceof Error && settingsError.message.includes("Redis is not configured");
      if (!isRedisError) {
        throw settingsError;
      }
      warning = "Storage not configured. Field mapping won't be saved until storage is set up.";
    }

    return NextResponse.json({
      status: "success",
      fieldMapping,
      ...(warning ? { warning } : {}),
    });
  } catch (error) {
    console.error("Error saving field mapping:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save field mapping" },
      { status: 500 },
    );
  }
}

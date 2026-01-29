/**
 * Setup API - Notion Database Property Creation
 * POST: Create a new property in the user's Notion database
 */

import { getSettings } from "@/lib/settings";
import { Client } from "@notionhq/client";
import type { UpdateDatabaseParameters } from "@notionhq/client/build/src/api-endpoints";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const propertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  type: z.enum(["title", "rich_text", "number", "date", "checkbox", "url", "select"]),
});

type PropertyType = z.infer<typeof propertySchema>["type"];

/**
 * POST - Create a new property in the Notion database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = propertySchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const { name, type } = result.data;

    // Get saved settings
    const settings = await getSettings();
    if (!settings?.notion?.apiToken || !settings?.notion?.databaseId) {
      return NextResponse.json(
        { error: "Notion not configured. Please complete the Notion setup first." },
        { status: 400 },
      );
    }

    const { apiToken, databaseId } = settings.notion;
    const notion = new Client({ auth: apiToken });

    // Build the property schema based on type
    const buildPropertySchema = (propType: PropertyType): UpdateDatabaseParameters["properties"] => {
      switch (propType) {
        case "title":
          return { [name]: { title: {} } };
        case "rich_text":
          return { [name]: { rich_text: {} } };
        case "number":
          return { [name]: { number: { format: "number" } } };
        case "date":
          return { [name]: { date: {} } };
        case "checkbox":
          return { [name]: { checkbox: {} } };
        case "url":
          return { [name]: { url: {} } };
        case "select":
          return { [name]: { select: { options: [] } } };
      }
    };

    // Create the property using databases.update
    const response = await notion.databases.update({
      database_id: databaseId,
      properties: buildPropertySchema(type),
    });

    // Find the created property in the response
    const createdProperty = response.properties[name];
    if (!createdProperty) {
      return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      property: {
        id: createdProperty.id,
        name: name,
        type: createdProperty.type,
      },
    });
  } catch (error) {
    console.error("Error creating Notion property:", error);

    // Handle specific Notion API errors
    if (error instanceof Error) {
      if (error.message.includes("Could not find database")) {
        return NextResponse.json(
          { error: "Database not found. Please check your Notion connection." },
          { status: 404 },
        );
      }
      if (error.message.includes("unauthorized")) {
        return NextResponse.json(
          { error: "Not authorized to modify this database." },
          { status: 403 },
        );
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create property" },
      { status: 500 },
    );
  }
}

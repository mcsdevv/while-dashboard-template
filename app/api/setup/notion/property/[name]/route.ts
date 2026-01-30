/**
 * Setup API - Notion Database Property Rename
 * PATCH: Rename an existing property in the user's Notion database
 */

import { getSettings } from "@/lib/settings";
import { Client } from "@notionhq/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const renameSchema = z.object({
  newName: z.string().min(1, "New property name is required"),
});

/**
 * PATCH - Rename a property in the Notion database
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name: currentName } = await params;
    const decodedName = decodeURIComponent(currentName);

    const body = await request.json();
    const result = renameSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const { newName } = result.data;

    // Don't allow renaming to the same name
    if (newName === decodedName) {
      return NextResponse.json(
        { error: "New name must be different from current name" },
        { status: 400 },
      );
    }

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

    // First, fetch the database to verify the property exists
    const database = await notion.databases.retrieve({ database_id: databaseId });
    const existingProperty = database.properties[decodedName];

    if (!existingProperty) {
      return NextResponse.json(
        { error: `Property "${decodedName}" not found in database` },
        { status: 404 },
      );
    }

    // Check if target name already exists
    if (database.properties[newName]) {
      return NextResponse.json(
        { error: `A property named "${newName}" already exists` },
        { status: 409 },
      );
    }

    // Rename the property using databases.update
    // Pass the old name as the key with the new name in the object
    const response = await notion.databases.update({
      database_id: databaseId,
      properties: {
        [decodedName]: { name: newName },
      },
    });

    // Find the renamed property in the response
    const renamedProperty = response.properties[newName];
    if (!renamedProperty) {
      return NextResponse.json({ error: "Failed to rename property" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      property: {
        id: renamedProperty.id,
        name: newName,
        type: renamedProperty.type,
      },
    });
  } catch (error) {
    console.error("Error renaming Notion property:", error);

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
      { error: error instanceof Error ? error.message : "Failed to rename property" },
      { status: 500 },
    );
  }
}

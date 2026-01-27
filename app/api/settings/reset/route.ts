/**
 * Settings API - Reset
 * POST: Reset specific sections of settings
 */

import { DEFAULT_FIELD_MAPPING, deleteSettings, getSettings, updateSettings } from "@/lib/settings";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const resetSchema = z.object({
  type: z.enum(["mapping", "sync", "all"]),
});

/**
 * POST - Reset settings
 *
 * type: "mapping" - Reset field mapping to defaults
 * type: "sync" - Clear sync state (placeholder for future)
 * type: "all" - Delete all settings (requires re-setup)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = resetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid reset type. Must be 'mapping', 'sync', or 'all'" },
        { status: 400 },
      );
    }

    const { type } = result.data;

    switch (type) {
      case "mapping": {
        await updateSettings({ fieldMapping: DEFAULT_FIELD_MAPPING });
        return NextResponse.json({
          success: true,
          message: "Field mapping reset to defaults",
        });
      }

      case "sync": {
        // Future: Clear gcalEventId from all Notion pages
        // For now, just acknowledge the request
        const settings = await getSettings();
        if (!settings) {
          return NextResponse.json({ error: "No settings found" }, { status: 400 });
        }

        // Note: Actual sync state clearing would require Notion API calls
        // to remove gcalEventId from all pages. This is a placeholder.
        return NextResponse.json({
          success: true,
          message: "Sync state clear requested. Manual database cleanup may be required.",
        });
      }

      case "all": {
        await deleteSettings();
        return NextResponse.json({
          success: true,
          message: "All settings deleted. Please complete setup again.",
          redirect: "/setup",
        });
      }

      default:
        return NextResponse.json({ error: "Unknown reset type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error resetting settings:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset settings" },
      { status: 500 },
    );
  }
}

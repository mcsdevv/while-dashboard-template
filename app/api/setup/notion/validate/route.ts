/**
 * Setup API - Notion Token Validation (Lightweight)
 * POST: Quick validation of Notion API token with capability checking
 *
 * This endpoint is designed for debounced validation during token input.
 * It does NOT save the token - use /api/setup/notion for that.
 */

import { Client } from "@notionhq/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const validateTokenSchema = z.object({
  apiToken: z.string().min(1, "API token is required"),
});

interface ValidationResult {
  valid: boolean;
  databaseCount: number;
  integrationName?: string;
  workspaceName?: string;
  capabilities: {
    read: boolean;
    update: boolean;
    insert: boolean;
  };
  errors: string[];
}

/**
 * POST - Validate Notion API token (lightweight, no save)
 */
export async function POST(request: NextRequest): Promise<NextResponse<ValidationResult>> {
  try {
    const body = await request.json();
    const result = validateTokenSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        valid: false,
        databaseCount: 0,
        capabilities: { read: false, update: false, insert: false },
        errors: ["Invalid token format"],
      });
    }

    const { apiToken } = result.data;
    const notion = new Client({ auth: apiToken });
    const errors: string[] = [];

    // Test read capability by searching for databases
    let databaseCount = 0;
    let canRead = false;

    try {
      const response = await notion.search({
        filter: { property: "object", value: "database" },
        page_size: 50,
      });

      canRead = true;
      databaseCount = response.results.filter(
        (result) => result.object === "database",
      ).length;

      if (databaseCount === 0) {
        errors.push("No databases shared with integration");
      }
    } catch {
      errors.push("Invalid token or missing read capability");
      return NextResponse.json({
        valid: false,
        databaseCount: 0,
        capabilities: { read: false, update: false, insert: false },
        errors,
      });
    }

    // Get integration info via users.me()
    let integrationName: string | undefined;
    let workspaceName: string | undefined;

    try {
      const botInfo = await notion.users.me({});
      if (botInfo.type === "bot" && botInfo.bot) {
        integrationName = botInfo.name ?? undefined;
        if ("workspace_name" in botInfo.bot) {
          workspaceName = botInfo.bot.workspace_name as string | undefined;
        }
      }
    } catch {
      // Non-critical, continue without bot info
    }

    // Note: We can't directly test update/insert capabilities without actually
    // creating/modifying data. The Notion API doesn't expose capability info.
    // We infer capabilities are enabled if the token works at all, since
    // internal integrations typically have all capabilities enabled by default.
    // The user will see errors at sync time if capabilities are missing.

    return NextResponse.json({
      valid: true,
      databaseCount,
      integrationName,
      workspaceName,
      capabilities: {
        read: canRead,
        update: true, // Assumed - will fail at sync time if not enabled
        insert: true, // Assumed - will fail at sync time if not enabled
      },
      errors,
    });
  } catch (error) {
    console.error("Error validating Notion token:", error);
    return NextResponse.json({
      valid: false,
      databaseCount: 0,
      capabilities: { read: false, update: false, insert: false },
      errors: [error instanceof Error ? error.message : "Failed to validate token"],
    });
  }
}

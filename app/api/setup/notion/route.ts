/**
 * Setup API - Notion Token Validation
 * POST: Validate Notion API token and list accessible databases
 */

import { env } from "@/lib/env";
import { getSettings, updateSettings } from "@/lib/settings";
import { Client } from "@notionhq/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const notionTokenSchema = z.object({
  apiToken: z.string().optional(),
  useEnvToken: z.boolean().optional(),
});

/**
 * POST - Validate Notion API token and list databases
 * Can use: provided apiToken, env token (useEnvToken: true), or saved settings token (empty body)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = notionTokenSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const { apiToken: providedToken, useEnvToken } = result.data;

    // Determine which token to use: provided > env > saved settings
    let apiToken: string | undefined;
    if (providedToken) {
      apiToken = providedToken;
    } else if (useEnvToken) {
      apiToken = env.NOTION_API_TOKEN;
    } else {
      // Use saved settings token
      const settings = await getSettings();
      apiToken = settings?.notion?.apiToken;
    }

    if (!apiToken) {
      return NextResponse.json({ error: "No token available" }, { status: 400 });
    }

    // Test the token by listing databases
    const notion = new Client({ auth: apiToken });

    try {
      const response = await notion.search({
        filter: { property: "object", value: "database" },
        page_size: 50,
      });

      const databases = response.results
        .filter((result) => result.object === "database")
        .map((db) => ({
          id: db.id,
          name: "title" in db ? db.title?.[0]?.plain_text || "Untitled" : "Untitled",
          url: "url" in db ? db.url : undefined,
        }));

      // Get integration info
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

      // Save the token only if a new one was provided (not when using existing saved token)
      let warning: string | undefined;
      const isNewToken = !!providedToken || useEnvToken;
      if (isNewToken) {
        try {
          await updateSettings({
            notion: {
              apiToken,
              databaseId: "", // Will be set when user selects database
              databaseName: undefined,
            },
          });
        } catch (settingsError) {
          console.error("Failed to save settings:", settingsError);
          const isRedisError =
            settingsError instanceof Error &&
            settingsError.message.includes("Redis is not configured");
          if (!isRedisError) {
            return NextResponse.json(
              { error: "Failed to save settings. Please try again." },
              { status: 500 },
            );
          }
          warning =
            "Storage not configured. Token validated, but settings won't be saved until storage is set up.";
        }
      }

      return NextResponse.json({
        status: "success",
        message: "Notion token validated",
        databases,
        integrationName,
        workspaceName,
        ...(warning ? { warning } : {}),
      });
    } catch (notionError) {
      console.error("Notion API error:", notionError);
      return NextResponse.json(
        { error: "Invalid Notion token or insufficient permissions" },
        { status: 401 },
      );
    }
  } catch (error) {
    console.error("Error validating Notion token:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to validate token" },
      { status: 500 },
    );
  }
}

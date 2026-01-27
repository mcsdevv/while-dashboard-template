import {
  createNotionWebhook,
  deleteNotionWebhook as deleteNotionWebhookAPI,
  listNotionWebhooks,
} from "@/lib/notion/client";
import { getNotionConfig } from "@/lib/settings";
import { logWebhookEvent } from "@/lib/sync/logger";
import {
  deleteNotionWebhook,
  getNotionWebhook,
  saveNotionWebhook,
} from "@/lib/webhook/channel-manager";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Verify admin authorization
 */
function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    console.warn("⚠️  ADMIN_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${adminSecret}`;
}

/**
 * POST - Create/setup Notion webhook subscription
 *
 * Supports two modes:
 * 1. Auto-create via API (doesn't work - Notion requires manual creation)
 * 2. Register existing webhook (pass subscriptionId and verificationToken in body)
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const notionConfig = await getNotionConfig();

    // If subscriptionId and verificationToken are provided, just register the existing webhook
    if (body.subscriptionId && body.verificationToken) {
      console.log("📝 Registering existing Notion webhook:", body.subscriptionId);

      await saveNotionWebhook({
        subscriptionId: body.subscriptionId,
        databaseId: notionConfig.databaseId,
        verificationToken: body.verificationToken,
        createdAt: new Date(),
        verified: true, // Assume it's already verified if they're registering it
      });

      await logWebhookEvent({
        type: "setup",
        status: "success",
      });

      return NextResponse.json({
        status: "success",
        message: "Existing webhook registered successfully",
        subscription: {
          subscriptionId: body.subscriptionId,
          databaseId: notionConfig.databaseId,
          verified: true,
        },
      });
    }

    // Get webhook URL from request or environment
    const webhookUrl =
      body.webhookUrl || process.env.WEBHOOK_URL || `${request.nextUrl.origin}/api/webhooks/notion`;

    console.log(`🔧 Setting up Notion webhook to: ${webhookUrl}`);

    // Delete existing webhook if present
    const existingWebhook = await getNotionWebhook();
    if (existingWebhook) {
      console.log(`🗑️  Deleting existing webhook: ${existingWebhook.subscriptionId}`);
      try {
        await deleteNotionWebhookAPI(existingWebhook.subscriptionId);
      } catch (error) {
        console.warn("Failed to delete existing webhook (may not exist):", error);
      }
      await deleteNotionWebhook();
    }

    // Create new webhook subscription
    console.log("📝 Creating new Notion webhook subscription...");
    const webhookResponse = await createNotionWebhook({
      url: webhookUrl,
      databaseId: notionConfig.databaseId,
      eventTypes: ["page.content_updated"],
    });

    console.log("✅ Notion webhook created:", webhookResponse.id);

    // Generate verification token (will be provided by Notion in verification request)
    // For now, we'll store a placeholder and update it when we receive the verification request
    const verificationToken = body.verificationToken || "pending";

    // Save webhook metadata to Redis
    await saveNotionWebhook({
      subscriptionId: webhookResponse.id,
      databaseId: notionConfig.databaseId,
      verificationToken,
      createdAt: new Date(),
      verified: false, // Will be set to true after manual verification in Notion UI
    });

    // Log the setup
    await logWebhookEvent({
      type: "setup",
      status: "success",
    });

    console.log("✅ Notion webhook setup complete!");
    console.log(
      "⚠️  IMPORTANT: You must manually verify this webhook in the Notion integration settings!",
    );
    console.log("   1. Go to https://www.notion.so/my-integrations");
    console.log("   2. Find your integration and go to webhooks settings");
    console.log(`   3. Verify the webhook for URL: ${webhookUrl}`);

    return NextResponse.json({
      status: "success",
      message: "Webhook created! Please verify it manually in Notion integration settings.",
      webhook: {
        id: webhookResponse.id,
        url: webhookResponse.url,
        state: webhookResponse.state,
        eventTypes: webhookResponse.event_types,
        createdAt: webhookResponse.created_time,
      },
      verificationRequired: true,
      verificationInstructions: {
        step1: "Go to https://www.notion.so/my-integrations",
        step2: "Find your integration and go to webhooks settings",
        step3: `Verify the webhook for URL: ${webhookUrl}`,
      },
    });
  } catch (error) {
    console.error("❌ Failed to setup Notion webhook:", error);

    await logWebhookEvent({
      type: "setup",
      status: "failure",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to setup webhook",
      },
      { status: 500 },
    );
  }
}

/**
 * GET - Check Notion webhook subscription status
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await getNotionWebhook();

    // List all webhooks from Notion API (regardless of local state)
    const apiWebhooks = await listNotionWebhooks();

    if (!subscription) {
      // No local subscription, but show what exists in Notion API
      return NextResponse.json({
        status: "not_configured",
        message: "No Notion webhook subscription found in Redis",
        notionApiWebhooks: apiWebhooks.map((w) => ({
          id: w.id,
          url: w.url,
          state: w.state,
          eventTypes: w.event_types,
          createdTime: w.created_time,
        })),
        hint:
          apiWebhooks.length > 0
            ? "Webhooks exist in Notion but not registered locally. Use POST with subscriptionId and verificationToken to register."
            : "No webhooks found. Create one in Notion integration settings.",
      });
    }

    // Has local subscription, check if it matches Notion API
    const activeWebhook = apiWebhooks.find((w) => w.id === subscription.subscriptionId);

    return NextResponse.json({
      status: "configured",
      subscription: {
        id: subscription.subscriptionId,
        databaseId: subscription.databaseId,
        verified: subscription.verified,
        createdAt: subscription.createdAt,
      },
      apiStatus: activeWebhook
        ? {
            state: activeWebhook.state,
            url: activeWebhook.url,
            eventTypes: activeWebhook.event_types,
          }
        : { state: "not_found_in_api", message: "Webhook not found in Notion API" },
      allNotionWebhooks: apiWebhooks.map((w) => ({
        id: w.id,
        url: w.url,
        state: w.state,
      })),
    });
  } catch (error) {
    console.error("❌ Failed to get Notion webhook status:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get status",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Remove Notion webhook subscription
 */
export async function DELETE(request: NextRequest) {
  // Verify authorization
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await getNotionWebhook();

    if (!subscription) {
      return NextResponse.json({
        status: "not_found",
        message: "No Notion webhook subscription to delete",
      });
    }

    console.log(`🗑️  Deleting Notion webhook: ${subscription.subscriptionId}`);

    // Delete from Notion API
    try {
      await deleteNotionWebhookAPI(subscription.subscriptionId);
    } catch (error) {
      console.warn("Failed to delete webhook from Notion API:", error);
    }

    // Delete from Redis
    await deleteNotionWebhook();

    console.log("✅ Notion webhook deleted");

    return NextResponse.json({
      status: "success",
      message: "Webhook subscription deleted",
    });
  } catch (error) {
    console.error("❌ Failed to delete Notion webhook:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete webhook",
      },
      { status: 500 },
    );
  }
}

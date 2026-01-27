import {
  fetchGcalEventsSince,
  setupGcalWebhook,
  stopGcalWebhook,
} from "@/lib/google-calendar/client";
import { getGoogleConfig } from "@/lib/settings";
import { authHeaderSchema, parseJsonBody, webhookSetupRequestSchema } from "@/lib/validation";
import {
  deleteWebhookChannel,
  getTimeUntilExpiration,
  getWebhookChannel,
  isChannelExpired,
  saveWebhookChannel,
  updateSyncState,
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

  if (!authHeader) {
    return false;
  }

  // Validate Bearer token format
  const validation = authHeaderSchema.safeParse(authHeader);
  if (!validation.success) {
    console.warn("⚠️  Invalid authorization header format");
    return false;
  }

  return authHeader === `Bearer ${adminSecret}`;
}

/**
 * POST - Create/setup new webhook channel
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔧 Setting up Google Calendar webhook channel...");

    // Check if there's an existing channel
    const existingChannel = await getWebhookChannel();
    if (existingChannel) {
      console.log("⚠️  Existing channel found, stopping it first...");
      try {
        await stopGcalWebhook(existingChannel.channelId, existingChannel.resourceId);
        await deleteWebhookChannel();
      } catch (error) {
        console.warn("Failed to stop existing channel (might already be stopped):", error);
      }
    }

    // Validate and parse request body
    const bodyResult = await parseJsonBody(request, webhookSetupRequestSchema);
    if (!bodyResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: bodyResult.error },
        { status: 400 },
      );
    }

    const { webhookUrl: requestUrl } = bodyResult.data;

    // Get webhook URL from request, environment, or construct from host
    const webhookUrl =
      requestUrl ||
      process.env.WEBHOOK_URL ||
      `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("host")}/api/webhooks/google-calendar`;

    console.log(`📍 Webhook URL: ${webhookUrl}`);

    // Validate webhook URL is publicly accessible
    if (webhookUrl.includes("localhost") || webhookUrl.includes("127.0.0.1")) {
      return NextResponse.json(
        { error: "Webhook URL must be publicly accessible" },
        { status: 400 },
      );
    }

    // Create new webhook channel
    console.log("🔗 Creating webhook channel...");
    const channelInfo = await setupGcalWebhook(webhookUrl);

    // Get calendar ID from config
    const googleConfig = await getGoogleConfig();

    // Save channel metadata to Redis
    await saveWebhookChannel({
      channelId: channelInfo.channelId,
      resourceId: channelInfo.resourceId,
      expiration: channelInfo.expiration,
      calendarId: googleConfig.calendarId,
      createdAt: new Date(),
      lastRenewedAt: new Date(),
    });

    console.log(`✓ Webhook channel created: ${channelInfo.channelId}`);

    // Perform initial sync to establish sync token
    console.log("🔄 Performing initial sync to establish baseline...");
    const result = await fetchGcalEventsSince(undefined);
    if (result.nextSyncToken) {
      await updateSyncState(result.nextSyncToken);
      console.log("✓ Initial sync token established");
    }

    const expiresAt = new Date(channelInfo.expiration);
    const expiresIn = channelInfo.expiration - Date.now();

    return NextResponse.json({
      status: "success",
      channel: {
        channelId: channelInfo.channelId,
        resourceId: channelInfo.resourceId,
        expiresAt: expiresAt.toISOString(),
        expiresInHours: Math.round(expiresIn / (1000 * 60 * 60)),
        webhookUrl,
      },
    });
  } catch (error) {
    console.error("❌ Error setting up webhook:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to setup webhook",
      },
      { status: 500 },
    );
  }
}

/**
 * GET - Check current webhook channel status
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const channel = await getWebhookChannel();

    if (!channel) {
      return NextResponse.json({
        status: "no_channel",
        message: "No webhook channel configured. Call POST to setup.",
      });
    }

    const expired = isChannelExpired(channel);
    const expiresIn = getTimeUntilExpiration(channel);
    const expiresInHours = Math.round(expiresIn / (1000 * 60 * 60));

    return NextResponse.json({
      status: expired ? "expired" : "active",
      channel: {
        channelId: channel.channelId,
        resourceId: channel.resourceId,
        calendarId: channel.calendarId,
        expiresAt: new Date(channel.expiration).toISOString(),
        expiresInHours,
        createdAt: channel.createdAt,
        lastRenewedAt: channel.lastRenewedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching webhook status:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get status",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Manually stop webhook channel
 */
export async function DELETE(request: NextRequest) {
  // Verify authorization
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const channel = await getWebhookChannel();

    if (!channel) {
      return NextResponse.json({
        status: "no_channel",
        message: "No webhook channel to stop",
      });
    }

    console.log(`🛑 Stopping webhook channel: ${channel.channelId}`);

    // Stop the channel with Google
    await stopGcalWebhook(channel.channelId, channel.resourceId);

    // Delete from Redis
    await deleteWebhookChannel();

    console.log("✓ Webhook channel stopped");

    return NextResponse.json({
      status: "success",
      message: "Webhook channel stopped",
    });
  } catch (error) {
    console.error("Error stopping webhook:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to stop webhook",
      },
      { status: 500 },
    );
  }
}

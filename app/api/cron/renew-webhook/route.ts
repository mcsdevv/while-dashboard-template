import {
  fetchGcalEventsSince,
  setupGcalWebhook,
  stopGcalWebhook,
} from "@/lib/google-calendar/client";
import { getGoogleConfig } from "@/lib/settings";
import {
  getWebhookChannel,
  needsRenewal,
  saveWebhookChannel,
  updateSyncState,
} from "@/lib/webhook/channel-manager";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Cron job to automatically renew webhook channels before expiration
 * Runs every 6 hours to check if renewal is needed
 * Renews if channel expires in less than 6 hours
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron authorization
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Webhook renewal cron job started...");

    // Get current webhook channel
    const channel = await getWebhookChannel();

    if (!channel) {
      console.log("⚠️  No webhook channel found, skipping renewal");
      return NextResponse.json({
        status: "no_channel",
        message: "No webhook channel to renew. Call POST /api/admin/webhook/setup to create one.",
      });
    }

    // Check if channel needs renewal
    if (!needsRenewal(channel)) {
      const expiresIn = channel.expiration - Date.now();
      const expiresInHours = Math.round(expiresIn / (1000 * 60 * 60));

      console.log(`✓ Channel doesn't need renewal yet (expires in ${expiresInHours} hours)`);

      return NextResponse.json({
        status: "not_needed",
        message: `Channel expires in ${expiresInHours} hours`,
        expiresAt: new Date(channel.expiration).toISOString(),
      });
    }

    console.log("⚠️  Channel expires soon, renewing...");

    // Stop old channel
    try {
      await stopGcalWebhook(channel.channelId, channel.resourceId);
      console.log(`✓ Stopped old channel: ${channel.channelId}`);
    } catch (error) {
      console.warn("Failed to stop old channel (might already be stopped):", error);
    }

    // Get webhook URL
    const webhookUrl =
      process.env.WEBHOOK_URL ||
      `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("host")}/api/webhooks/google-calendar`;

    // Create new channel
    console.log("🔗 Creating new webhook channel...");
    const newChannelInfo = await setupGcalWebhook(webhookUrl);

    // Get calendar ID from config
    const googleConfig = await getGoogleConfig();

    // Save new channel metadata
    await saveWebhookChannel({
      channelId: newChannelInfo.channelId,
      resourceId: newChannelInfo.resourceId,
      expiration: newChannelInfo.expiration,
      calendarId: googleConfig.calendarId,
      createdAt: channel.createdAt, // Keep original creation time
      lastRenewedAt: new Date(),
    });

    // Re-establish sync token with new channel
    console.log("🔄 Re-establishing sync token...");
    const result = await fetchGcalEventsSince(undefined);
    if (result.nextSyncToken) {
      await updateSyncState(result.nextSyncToken);
      console.log("✓ Sync token re-established");
    }

    const expiresAt = new Date(newChannelInfo.expiration);
    const expiresIn = newChannelInfo.expiration - Date.now();
    const expiresInHours = Math.round(expiresIn / (1000 * 60 * 60));

    console.log(
      `✅ Webhook channel renewed successfully (new expiration: ${expiresAt.toISOString()})`,
    );

    return NextResponse.json({
      status: "renewed",
      message: "Channel renewed successfully",
      channel: {
        channelId: newChannelInfo.channelId,
        resourceId: newChannelInfo.resourceId,
        expiresAt: expiresAt.toISOString(),
        expiresInHours,
      },
    });
  } catch (error) {
    console.error("❌ Error renewing webhook channel:", error);

    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Failed to renew webhook",
      },
      { status: 500 },
    );
  }
}

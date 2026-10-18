import { setupGcalWebhook, stopGcalWebhook } from "@/lib/google-calendar/client";
import { getGoogleConfig } from "@/lib/settings";
import { getWebhookChannel, needsRenewal, saveWebhookChannel } from "@/lib/webhook/channel-manager";
import { type NextRequest, NextResponse } from "next/server";
import { acquireLock } from "@/lib/webhook/lock";

export const maxDuration = 60;

/**
 * Cron job to automatically renew webhook channels before expiration
 * Runs daily and renews within 36 hours of expiration.
 */
export async function GET(request: NextRequest) {
  let release: (() => Promise<void>) | null = null;
  try {
    // Verify cron authorization
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    release = await acquireLock("webhook:gcal:renewal", 90);
    if (!release) return NextResponse.json({ status: "already_running" });

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

    // Get webhook URL
    const webhookUrl =
      process.env.WEBHOOK_URL ||
      `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("host")}/api/webhooks/google-calendar`;

    // Create new channel
    console.log("🔗 Creating new webhook channel...");
    const googleConfig = await getGoogleConfig();
    const newChannelInfo = await setupGcalWebhook(webhookUrl);

    // Keep the working channel until its replacement is durably stored.
    try {
      await saveWebhookChannel({
        ...newChannelInfo,
        calendarId: googleConfig.calendarId,
        createdAt: channel.createdAt,
        lastRenewedAt: new Date(),
      });
    } catch (error) {
      await stopGcalWebhook(newChannelInfo.channelId, newChannelInfo.resourceId).catch(() => {});
      throw error;
    }
    try {
      await stopGcalWebhook(channel.channelId, channel.resourceId);
    } catch (error) {
      console.warn("Could not stop the previous webhook channel:", error);
    }
    // A channel renewal does not consume changes: preserve the existing calendar sync token.

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
  } finally {
    if (release)
      await release().catch((error) => console.error("Could not release renewal lock:", error));
  }
}

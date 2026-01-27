import { fetchGcalEvents, fetchGcalEventsSince } from "@/lib/google-calendar/client";
import { getRedis } from "@/lib/redis";
import { deleteFromNotion, syncGcalToNotion } from "@/lib/sync/engine";
import { logWebhookEvent } from "@/lib/sync/logger";
import { extractHeaders, gcalWebhookHeadersSchema, validateSafe } from "@/lib/validation";
import {
  clearSyncState,
  getSyncState,
  getWebhookChannel,
  updateSyncState,
} from "@/lib/webhook/channel-manager";
import { type NextRequest, NextResponse } from "next/server";

// Deduplication key prefix
const PROCESSED_MESSAGES_KEY = "webhook:processed:";

/**
 * GET handler for Google Calendar webhook verification
 */
export async function GET(request: NextRequest) {
  // Google Calendar sends a sync message to verify the webhook
  console.log("Google Calendar webhook verification received");
  return NextResponse.json({ status: "ok" });
}

/**
 * POST handler for Google Calendar push notifications
 * Receives notifications when calendar events change
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Extract and validate headers
    const headers = extractHeaders(request, [
      "x-goog-resource-state",
      "x-goog-resource-id",
      "x-goog-channel-id",
      "x-goog-message-number",
    ]);

    const validation = validateSafe(gcalWebhookHeadersSchema, headers);
    if (!validation.success) {
      console.error("❌ Invalid webhook headers:", validation.error);
      return NextResponse.json(
        { error: "Invalid webhook headers", details: validation.error },
        { status: 400 },
      );
    }

    const {
      "x-goog-resource-state": resourceState,
      "x-goog-resource-id": resourceId,
      "x-goog-channel-id": channelId,
      "x-goog-message-number": messageNumber,
    } = validation.data;

    console.log("🔔 Google Calendar webhook received:", {
      resourceState,
      resourceId,
      channelId,
      messageNumber,
    });

    // Validate channel ID matches stored channel (security)
    const storedChannel = await getWebhookChannel();
    if (!storedChannel || channelId !== storedChannel.channelId) {
      console.warn(`⚠️  Invalid webhook channel ID: ${channelId}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Deduplication: Check if we've already processed this message
    const redis = getRedis();
    if (messageNumber && redis) {
      const dedupeKey = `${PROCESSED_MESSAGES_KEY}${messageNumber}`;
      const alreadyProcessed = await redis.get(dedupeKey);

      if (alreadyProcessed) {
        console.log(`✓ Message ${messageNumber} already processed, skipping`);
        return NextResponse.json({ status: "duplicate_skipped" });
      }

      // Mark message as processed with 5-minute TTL
      await redis.set(dedupeKey, true, { ex: 300 });
    }

    // Resource state can be: 'sync', 'exists', 'not_exists'
    if (resourceState === "sync") {
      // Initial sync message when channel is created, just acknowledge
      console.log("✓ Initial sync message acknowledged");
      return NextResponse.json({ status: "sync_acknowledged" });
    }

    if (resourceState === "not_exists") {
      // Channel was stopped or expired
      console.error("❌ Webhook channel stopped or expired");
      return NextResponse.json({ status: "channel_stopped" }, { status: 410 });
    }

    // For 'exists' state: events have changed, fetch and process them
    console.log("📥 Processing Google Calendar changes...");

    // Get current sync state
    const syncState = await getSyncState();
    const { syncToken } = syncState;

    // Fetch changed events using sync token (incremental sync)
    let result = await fetchGcalEventsSince(syncToken);

    // If sync token is invalid, perform full sync
    if (result.invalidToken) {
      console.log("⚠️  Sync token invalid, performing full sync...");
      await clearSyncState();

      // Fetch all events from the last 30 days
      const fullEvents = await fetchGcalEvents(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

      // For initial sync, we need to establish a sync token
      // Fetch once more to get the sync token
      result = await fetchGcalEventsSince(undefined);

      // Process all events
      for (const event of fullEvents) {
        try {
          await syncGcalToNotion(event);
        } catch (error) {
          console.error(`Failed to sync event ${event.title}:`, error);
          // Continue processing other events
        }
      }
    } else {
      // Process incrementally fetched events
      console.log(`📊 Processing ${result.events.length} changed events`);

      for (const event of result.events) {
        try {
          // Handle deletions and creates/updates
          if (event.status === "cancelled") {
            // Event was deleted in Google Calendar
            if (event.notionPageId) {
              const eventStartTime = Date.now();
              console.log(`🗑️  GCal event deleted, removing from Notion: ${event.title}`);
              await deleteFromNotion(event.notionPageId, event.title);

              await logWebhookEvent({
                type: "notification",
                source: "gcal",
                webhookEventType: resourceState || "exists",
                action: "delete",
                eventTitle: event.title,
                eventId: event.gcalEventId || event.id,
                status: "success",
                processingTime: Date.now() - eventStartTime,
              });
            } else {
              console.log(`⚠️  Cancelled event has no Notion page ID: ${event.title}`);
            }
          } else {
            // Event was created or updated in Google Calendar
            const eventStartTime = Date.now();
            await syncGcalToNotion(event);

            await logWebhookEvent({
              type: "notification",
              source: "gcal",
              webhookEventType: resourceState || "exists",
              action: event.notionPageId ? "update" : "create",
              eventTitle: event.title,
              eventId: event.gcalEventId || event.id,
              status: "success",
              processingTime: Date.now() - eventStartTime,
            });
          }
        } catch (error) {
          console.error(`Failed to sync event ${event.title}:`, error);

          await logWebhookEvent({
            type: "notification",
            source: "gcal",
            webhookEventType: resourceState || "exists",
            eventTitle: event.title,
            eventId: event.gcalEventId || event.id,
            status: "failure",
            error: error instanceof Error ? error.message : "Unknown error",
          });
          // Continue processing other events
        }
      }
    }

    // Update sync state with new sync token
    if (result.nextSyncToken) {
      await updateSyncState(result.nextSyncToken);
      console.log("✓ Sync token updated");
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Webhook processing completed in ${processingTime}ms`);

    return NextResponse.json({
      status: "success",
      eventsProcessed: result.events.length,
      processingTime,
    });
  } catch (error) {
    console.error("❌ Error handling Google Calendar webhook:", error);

    // Return 500 to trigger Google's retry mechanism
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

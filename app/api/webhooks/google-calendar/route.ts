import { fetchGcalEventsSince } from "@/lib/google-calendar/client";
import { getRedis } from "@/lib/redis";
import { deleteFromNotion, syncGcalToNotion } from "@/lib/sync/engine";
import { logWebhookEvent } from "@/lib/sync/logger";
import { extractHeaders, gcalWebhookHeadersSchema, validateSafe } from "@/lib/validation";
import { getSyncState, getWebhookChannel, updateSyncState } from "@/lib/webhook/channel-manager";
import { acquireLock } from "@/lib/webhook/lock";
import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
const PROCESSED_MESSAGES_KEY = "webhook:processed:";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let release: (() => Promise<void>) | null = null;
  try {
    const validation = validateSafe(
      gcalWebhookHeadersSchema,
      extractHeaders(request, [
        "x-goog-resource-state",
        "x-goog-resource-id",
        "x-goog-channel-id",
        "x-goog-message-number",
      ]),
    );
    if (!validation.success) {
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
    const channel = await getWebhookChannel();
    if (!channel || channelId !== channel.channelId || resourceId !== channel.resourceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (resourceState === "sync") return NextResponse.json({ status: "sync_acknowledged" });
    if (resourceState === "not_exists") {
      return NextResponse.json({ status: "channel_stopped" }, { status: 410 });
    }

    const redis = getRedis();
    const dedupeKey = messageNumber
      ? `${PROCESSED_MESSAGES_KEY}${channelId}:${messageNumber}`
      : undefined;
    if (dedupeKey && (await redis?.get(dedupeKey))) {
      return NextResponse.json({ status: "duplicate_skipped" });
    }
    // Serialize access to the shared sync token across different notification messages.
    release = await acquireLock("webhook:gcal:processing");
    if (!release) {
      return NextResponse.json(
        { error: "Calendar sync already running" },
        { status: 503, headers: { "Retry-After": "10" } },
      );
    }

    const { syncToken } = await getSyncState();
    let result = await fetchGcalEventsSince(syncToken);
    if (result.invalidToken) result = await fetchGcalEventsSince(undefined);
    if (result.invalidToken || !result.nextSyncToken)
      throw new Error("Calendar sync did not return a new sync token");

    let failures = 0;
    for (const event of result.events) {
      const eventStartTime = Date.now();
      const action =
        event.status === "cancelled" ? "delete" : event.notionPageId ? "update" : "create";
      try {
        if (event.status === "cancelled") {
          if (event.notionPageId) await deleteFromNotion(event.notionPageId, event.title);
        } else {
          await syncGcalToNotion(event);
        }
        await logWebhookEvent({
          type: "notification",
          source: "gcal",
          webhookEventType: resourceState,
          action,
          eventTitle: event.title,
          eventId: event.gcalEventId || event.id,
          status: "success",
          processingTime: Date.now() - eventStartTime,
        });
      } catch (error) {
        failures++;
        await logWebhookEvent({
          type: "notification",
          source: "gcal",
          webhookEventType: resourceState,
          action,
          eventId: event.gcalEventId || event.id,
          status: "failure",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
    // Leave both the old cursor and deduplication state intact until every change succeeds.
    if (failures) throw new Error(`${failures} calendar event(s) failed to sync`);
    await updateSyncState(result.nextSyncToken);
    if (dedupeKey && redis) await redis.set(dedupeKey, true, { ex: 300 });
    return NextResponse.json({
      status: "success",
      eventsProcessed: result.events.length,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error("Google Calendar webhook failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  } finally {
    if (release)
      await release().catch((error) => console.error("Could not release webhook lock:", error));
  }
}

import { fetchGcalEvents } from "@/lib/google-calendar/client";
import { fetchNotionEvents } from "@/lib/notion/client";
import {
  deleteFromGcal,
  deleteFromNotion,
  syncGcalToNotion,
  syncNotionToGcal,
} from "@/lib/sync/engine";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Cron job endpoint to poll Notion for changes and sync to Google Calendar
 * This runs periodically (every 5 minutes) via Vercel Cron
 *
 * NOTE: This is now a FALLBACK mechanism
 * - Primary sync: Notion webhooks (batched, fast)
 * - Fallback sync: This cron job (every 5 min)
 * - GCal → Notion: Google Calendar webhooks (real-time)
 *
 * This cron ensures no events are missed if webhooks fail
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (Vercel sets this header)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Starting Notion fallback polling cron job...");
    console.log("ℹ️  Primary sync methods:");
    console.log("   - Notion → GCal: Notion webhooks (batched)");
    console.log("   - GCal → Notion: Google Calendar webhooks (real-time)");
    console.log("ℹ️  This cron job acts as fallback to catch any missed events");

    // Fetch events from Notion only
    const notionEvents = await fetchNotionEvents();
    console.log(`Fetched ${notionEvents.length} Notion events`);

    // Sync Notion events to Google Calendar
    for (const notionEvent of notionEvents) {
      try {
        await syncNotionToGcal(notionEvent);
      } catch (error) {
        // Log error but continue with other events
        console.error(`Failed to sync Notion event ${notionEvent.title}:`, error);
      }
    }

    // Note: GCal → Notion sync removed - now handled by webhook in real-time

    // DELETION DETECTION: Notion → GCal only
    // (GCal → Notion deletion is now handled by webhook)

    // Fetch GCal events to detect Notion-originated deletions
    const gcalEvents = await fetchGcalEvents(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const notionPageIds = new Set(notionEvents.map((e) => e.notionPageId || e.id).filter(Boolean));

    let deletionsFromGcal = 0;

    // Detect Notion → GCal deletions
    // If a GCal event has a notion_page_id but that Notion page no longer exists, delete from GCal
    for (const gcalEvent of gcalEvents) {
      if (gcalEvent.notionPageId && !notionPageIds.has(gcalEvent.notionPageId)) {
        console.log(
          `🗑️  Detected deletion: Notion page ${gcalEvent.notionPageId} no longer exists, deleting GCal event "${gcalEvent.title}"`,
        );
        try {
          await deleteFromGcal(gcalEvent.gcalEventId || gcalEvent.id, gcalEvent.title);
          deletionsFromGcal++;
        } catch (error) {
          console.error(`Failed to delete GCal event ${gcalEvent.title}:`, error);
        }
      }
    }

    // Note: GCal → Notion deletion detection removed - now handled by webhook

    console.log("✅ Notion fallback polling cron job completed");
    console.log(`   Notion events synced (fallback): ${notionEvents.length}`);
    console.log(`   Deletions from GCal: ${deletionsFromGcal}`);
    console.log("ℹ️  Most events should be handled by Notion webhooks (primary method)");

    return NextResponse.json({
      status: "success",
      notionEventsSynced: notionEvents.length,
      deletionsFromGcal,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Sync cron job failed:", error);

    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

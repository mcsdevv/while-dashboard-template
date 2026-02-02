import { fetchGcalEvents } from "@/lib/google-calendar/client";
import { fetchNotionEvents } from "@/lib/notion/client";
import { syncGcalToNotion, syncNotionToGcal } from "@/lib/sync/engine";
import { NextResponse } from "next/server";

/**
 * Manual sync trigger endpoint
 * Performs bidirectional sync between Notion and Google Calendar
 */
export async function POST() {
  try {
    console.log("🔄 Manual sync triggered...");

    const results = {
      notionToGcal: { synced: 0, errors: 0 },
      gcalToNotion: { synced: 0, errors: 0 },
    };

    // Fetch events from both sources
    const [notionEvents, gcalEvents] = await Promise.all([
      fetchNotionEvents(),
      fetchGcalEvents(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    ]);

    console.log(`Fetched ${notionEvents.length} Notion events`);
    console.log(`Fetched ${gcalEvents.length} Google Calendar events`);

    // Sync Notion → Google Calendar
    for (const event of notionEvents) {
      try {
        await syncNotionToGcal(event);
        results.notionToGcal.synced++;
      } catch (error) {
        console.error(`Failed to sync Notion event "${event.title}":`, error);
        results.notionToGcal.errors++;
      }
    }

    // Sync Google Calendar → Notion
    for (const event of gcalEvents) {
      try {
        await syncGcalToNotion(event);
        results.gcalToNotion.synced++;
      } catch (error) {
        console.error(`Failed to sync GCal event "${event.title}":`, error);
        results.gcalToNotion.errors++;
      }
    }

    console.log("✅ Manual sync completed");
    console.log(
      `   Notion → GCal: ${results.notionToGcal.synced} synced, ${results.notionToGcal.errors} errors`,
    );
    console.log(
      `   GCal → Notion: ${results.gcalToNotion.synced} synced, ${results.gcalToNotion.errors} errors`,
    );

    return NextResponse.json({
      status: "success",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Manual sync failed:", error);

    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

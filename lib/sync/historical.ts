/**
 * Historical sync service for syncing past Google Calendar events to Notion.
 * Allows users to sync events from a specified time period when first enabling sync.
 */
import { fetchGcalEvents } from "@/lib/google-calendar/client";
import { getRedis } from "@/lib/redis";
import { syncGcalToNotion } from "@/lib/sync/engine";
import type { Event } from "@/lib/types";

// Redis key for historical sync progress
const HISTORICAL_SYNC_PROGRESS_KEY = "sync:historical:progress";

// Process events in batches of 50 (smaller than backfill due to create/update complexity)
const BATCH_SIZE = 50;

// Maximum days allowed for historical sync (1 year)
export const MAX_HISTORICAL_DAYS = 365;

export interface HistoricalSyncProgress {
  status: "idle" | "running" | "completed" | "failed" | "cancelled";
  total: number;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  days: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface HistoricalSyncPreview {
  total: number;
  newEvents: number;
  alreadySynced: number;
  recurringInstances: number;
}

const DEFAULT_PROGRESS: HistoricalSyncProgress = {
  status: "idle",
  total: 0,
  processed: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
  days: 0,
};

/**
 * Get current historical sync progress from Redis
 */
export async function getHistoricalSyncProgress(): Promise<HistoricalSyncProgress> {
  const redis = getRedis();
  if (!redis) {
    return DEFAULT_PROGRESS;
  }

  const progress = await redis.get<HistoricalSyncProgress>(HISTORICAL_SYNC_PROGRESS_KEY);
  return progress || DEFAULT_PROGRESS;
}

/**
 * Update historical sync progress in Redis
 */
async function updateProgress(progress: Partial<HistoricalSyncProgress>): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const current = await getHistoricalSyncProgress();
  await redis.set(HISTORICAL_SYNC_PROGRESS_KEY, { ...current, ...progress });
}

/**
 * Check if historical sync has been cancelled
 */
async function isCancelled(): Promise<boolean> {
  const progress = await getHistoricalSyncProgress();
  return progress.status === "cancelled";
}

/**
 * Cancel a running historical sync
 */
export async function cancelHistoricalSync(): Promise<void> {
  const progress = await getHistoricalSyncProgress();
  if (progress.status === "running") {
    await updateProgress({ status: "cancelled" });
  }
}

/**
 * Reset historical sync progress to idle state
 */
export async function resetHistoricalSync(): Promise<void> {
  await updateProgress(DEFAULT_PROGRESS);
}

/**
 * Check if an event is a recurring instance (has a recurringEventId or is part of a series)
 */
function isRecurringInstance(event: Event): boolean {
  // Events expanded from recurring series have recurrence info or are instances
  return event.recurrence !== undefined;
}

/**
 * Get a preview of events that would be synced for a given time range.
 * Does not perform any sync operations.
 */
export async function getHistoricalSyncPreview(days: number): Promise<HistoricalSyncPreview> {
  // Calculate time range
  const timeMax = new Date();
  const timeMin = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  console.log(`📊 Fetching preview for historical sync: ${days} days back`);

  // Fetch all events in the date range
  const events = await fetchGcalEvents(timeMin, timeMax);

  // Categorize events
  let newEvents = 0;
  let alreadySynced = 0;
  let recurringInstances = 0;

  for (const event of events) {
    if (event.notionPageId) {
      alreadySynced++;
    } else {
      newEvents++;
    }

    if (isRecurringInstance(event)) {
      recurringInstances++;
    }
  }

  console.log(`📊 Preview: ${events.length} total, ${newEvents} new, ${alreadySynced} synced, ${recurringInstances} recurring`);

  return {
    total: events.length,
    newEvents,
    alreadySynced,
    recurringInstances,
  };
}

/**
 * Start historical sync for events from the specified number of days in the past.
 * This is a non-blocking operation that runs in the background.
 */
export async function startHistoricalSync(days: number): Promise<void> {
  // Validate days
  if (days < 1 || days > MAX_HISTORICAL_DAYS) {
    throw new Error(`Days must be between 1 and ${MAX_HISTORICAL_DAYS}`);
  }

  // Check if already running
  const currentProgress = await getHistoricalSyncProgress();
  if (currentProgress.status === "running") {
    throw new Error("Historical sync is already running");
  }

  console.log(`🔄 Starting historical sync for ${days} days back`);

  // Initialize progress
  await updateProgress({
    status: "running",
    total: 0,
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    days,
    startedAt: new Date().toISOString(),
    completedAt: undefined,
    error: undefined,
  });

  try {
    // Calculate time range
    const timeMax = new Date();
    const timeMin = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Fetch all events in the date range
    console.log(`📅 Fetching events from ${timeMin.toISOString()} to ${timeMax.toISOString()}`);
    const allEvents = await fetchGcalEvents(timeMin, timeMax);

    console.log(`📊 Found ${allEvents.length} events to process`);
    await updateProgress({ total: allEvents.length });

    // Process in batches
    let processed = 0;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < allEvents.length; i += BATCH_SIZE) {
      // Check for cancellation between batches
      if (await isCancelled()) {
        console.log("⚠️ Historical sync cancelled by user");
        return;
      }

      const batch = allEvents.slice(i, i + BATCH_SIZE);
      console.log(
        `📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allEvents.length / BATCH_SIZE)}`,
      );

      for (const event of batch) {
        try {
          // Determine if this is a create or update
          const isUpdate = !!event.notionPageId;

          // Sync the event (syncGcalToNotion handles both create and update)
          await syncGcalToNotion(event);

          if (isUpdate) {
            updated++;
          } else {
            created++;
          }

          processed++;
        } catch (error) {
          errors++;
          console.error(
            `✗ Failed to sync "${event.title}":`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      // Update progress after each batch
      await updateProgress({ processed, created, updated, skipped, errors });
    }

    // Mark as completed
    await updateProgress({
      status: "completed",
      processed,
      created,
      updated,
      skipped,
      errors,
      completedAt: new Date().toISOString(),
    });

    console.log(
      `✅ Historical sync completed: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors`,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Historical sync failed:", errorMessage);

    await updateProgress({
      status: "failed",
      error: errorMessage,
      completedAt: new Date().toISOString(),
    });

    throw error;
  }
}

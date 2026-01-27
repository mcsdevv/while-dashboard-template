import { fetchGcalEvents } from "@/lib/google-calendar/client";
import { updateNotionEvent } from "@/lib/notion/client";
/**
 * Backfill service for updating existing Notion pages with new field data from Google Calendar.
 * Used when users enable new fields (attendees, organizer, etc.) and want to populate
 * existing events with the new data.
 */
import { getRedis } from "@/lib/redis";
import { getExtendedFieldMapping } from "@/lib/settings";
import type { ExtendedFieldMapping } from "@/lib/settings/types";
import { retryWithBackoff } from "@/lib/sync/retry";
import type { Event } from "@/lib/types";

// Redis key for backfill progress
const BACKFILL_PROGRESS_KEY = "sync:backfill:progress";

// Process events in batches of 100
const BATCH_SIZE = 100;

export interface BackfillProgress {
  status: "idle" | "running" | "completed" | "failed" | "cancelled";
  total: number;
  processed: number;
  errors: number;
  fields: string[];
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

const DEFAULT_PROGRESS: BackfillProgress = {
  status: "idle",
  total: 0,
  processed: 0,
  errors: 0,
  fields: [],
};

/**
 * Get current backfill progress from Redis
 */
export async function getBackfillProgress(): Promise<BackfillProgress> {
  const redis = getRedis();
  if (!redis) {
    return DEFAULT_PROGRESS;
  }

  const progress = await redis.get<BackfillProgress>(BACKFILL_PROGRESS_KEY);
  return progress || DEFAULT_PROGRESS;
}

/**
 * Update backfill progress in Redis
 */
async function updateProgress(progress: Partial<BackfillProgress>): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const current = await getBackfillProgress();
  await redis.set(BACKFILL_PROGRESS_KEY, { ...current, ...progress });
}

/**
 * Check if backfill has been cancelled
 */
async function isCancelled(): Promise<boolean> {
  const progress = await getBackfillProgress();
  return progress.status === "cancelled";
}

/**
 * Cancel a running backfill
 */
export async function cancelBackfill(): Promise<void> {
  const progress = await getBackfillProgress();
  if (progress.status === "running") {
    await updateProgress({ status: "cancelled" });
  }
}

/**
 * Reset backfill progress to idle state
 */
export async function resetBackfill(): Promise<void> {
  await updateProgress(DEFAULT_PROGRESS);
}

/**
 * Build Notion update payload for enabled fields only
 */
function buildUpdatePayload(
  event: Event,
  fields: string[],
  fieldMapping: ExtendedFieldMapping,
): Partial<Event> {
  const updates: Partial<Event> = {};

  for (const field of fields) {
    const config = fieldMapping[field as keyof ExtendedFieldMapping];
    if (!config || !config.enabled) continue;

    switch (field) {
      case "attendees":
        if (event.attendees) {
          updates.attendees = event.attendees;
        }
        break;
      case "organizer":
        if (event.organizer) {
          updates.organizer = event.organizer;
        }
        break;
      case "conferenceLink":
        if (event.conferenceLink) {
          updates.conferenceLink = event.conferenceLink;
        }
        break;
      case "recurrence":
        if (event.recurrence) {
          updates.recurrence = event.recurrence;
        }
        break;
      case "color":
        if (event.color) {
          updates.color = event.color;
        }
        break;
      case "visibility":
        if (event.visibility) {
          updates.visibility = event.visibility;
        }
        break;
    }
  }

  return updates;
}

/**
 * Start backfill process for specified fields.
 * This is a non-blocking operation that runs in the background.
 */
export async function startBackfill(fields: string[]): Promise<void> {
  // Check if already running
  const currentProgress = await getBackfillProgress();
  if (currentProgress.status === "running") {
    throw new Error("Backfill is already running");
  }

  // Validate fields
  if (!fields || fields.length === 0) {
    throw new Error("No fields specified for backfill");
  }

  console.log(`🔄 Starting backfill for fields: ${fields.join(", ")}`);

  // Initialize progress
  await updateProgress({
    status: "running",
    total: 0,
    processed: 0,
    errors: 0,
    fields,
    startedAt: new Date().toISOString(),
    completedAt: undefined,
    error: undefined,
  });

  try {
    // Fetch all GCal events
    const allEvents = await fetchGcalEvents();

    // Filter to events that are already linked to Notion
    const linkedEvents = allEvents.filter((event) => event.notionPageId);

    console.log(`📊 Found ${linkedEvents.length} linked events to backfill`);

    await updateProgress({ total: linkedEvents.length });

    // Get field mapping configuration
    const fieldMapping = await getExtendedFieldMapping();

    // Process in batches
    let processed = 0;
    let errors = 0;

    for (let i = 0; i < linkedEvents.length; i += BATCH_SIZE) {
      // Check for cancellation between batches
      if (await isCancelled()) {
        console.log("⚠️ Backfill cancelled by user");
        return;
      }

      const batch = linkedEvents.slice(i, i + BATCH_SIZE);
      console.log(
        `📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(linkedEvents.length / BATCH_SIZE)}`,
      );

      for (const event of batch) {
        try {
          const updates = buildUpdatePayload(event, fields, fieldMapping);

          // Only update if there are actual changes
          if (Object.keys(updates).length > 0 && event.notionPageId) {
            await retryWithBackoff(() => updateNotionEvent(event.notionPageId!, updates), {
              onRetry: (error, attempt) => {
                console.log(
                  `Retrying update for "${event.title}" (attempt ${attempt}):`,
                  error.message,
                );
              },
            });
            console.log(`✓ Updated: ${event.title}`);
          }

          processed++;
        } catch (error) {
          errors++;
          console.error(
            `✗ Failed to update "${event.title}":`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      // Update progress after each batch
      await updateProgress({ processed, errors });
    }

    // Mark as completed
    await updateProgress({
      status: "completed",
      processed,
      errors,
      completedAt: new Date().toISOString(),
    });

    console.log(`✅ Backfill completed: ${processed} events processed, ${errors} errors`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Backfill failed:", errorMessage);

    await updateProgress({
      status: "failed",
      error: errorMessage,
      completedAt: new Date().toISOString(),
    });

    throw error;
  }
}

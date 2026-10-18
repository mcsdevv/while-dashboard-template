import { fetchGcalEventsPage, getGcalEvent } from "@/lib/google-calendar/client";
import { fetchNotionEventsPage, getNotionEvent, isNotionPageArchived } from "@/lib/notion/client";
import { getRedis } from "@/lib/redis";
import { getGoogleConfig, getNotionConfig } from "@/lib/settings";
import { deleteFromGcal, syncNotionToGcal } from "@/lib/sync/engine";
import { acquireLock } from "@/lib/webhook/lock";

const PROGRESS_KEY = "sync:notion:reconciliation";
const DAY = 24 * 60 * 60 * 1000;

interface Progress {
  scope: string;
  startedAt: string;
  phase: "notion" | "deletions";
  cursor?: string;
  nextCursor?: string;
  pendingIds?: string[];
  errors: number;
}

/** Save progress after each item and yield with time left for one slow API operation. */
export async function reconcileNotionEvents(budgetMs = 120_000) {
  const redis = getRedis();
  if (!redis) throw new Error("Redis not configured");
  const release = await acquireLock("sync:notion:reconciliation:lock");
  if (!release) return { status: "already_running" as const };
  try {
    const deadline = Date.now() + budgetMs;
    const [notion, google] = await Promise.all([getNotionConfig(), getGoogleConfig()]);
    const scope = `${notion.databaseId}:${google.calendarId}`;
    const stored = await redis.get<Progress>(PROGRESS_KEY);
    const progress: Progress =
      stored?.scope === scope
        ? stored
        : {
            scope,
            startedAt: new Date().toISOString(),
            phase: "notion",
            errors: 0,
          };
    let notionEventsSynced = 0;
    let deletionsFromGcal = 0;
    let errors = 0;

    while (Date.now() < deadline) {
      if (!progress.pendingIds) {
        if (progress.phase === "notion") {
          const page = await fetchNotionEventsPage(progress.cursor);
          progress.pendingIds = page.events.map((event) => event.notionPageId || event.id);
          progress.nextCursor = page.nextCursor;
        } else {
          // Fixed bounds keep pagination consistent when a cycle spans invocations.
          const start = new Date(progress.startedAt).getTime();
          const page = await fetchGcalEventsPage(
            new Date(start - 30 * DAY),
            new Date(start + 365 * DAY),
            progress.cursor,
          );
          progress.pendingIds = page.events
            .filter((event) => event.notionPageId)
            .map((event) => event.gcalEventId || event.id);
          progress.nextCursor = page.nextCursor;
        }
        await redis.set(PROGRESS_KEY, progress);
      }

      if (progress.pendingIds.length === 0) {
        if (progress.nextCursor) {
          progress.cursor = progress.nextCursor;
        } else if (progress.phase === "notion") {
          progress.phase = "deletions";
          progress.cursor = undefined;
        } else {
          await redis.del(PROGRESS_KEY);
          return {
            status: progress.errors ? ("partial" as const) : ("success" as const),
            notionEventsSynced,
            deletionsFromGcal,
            errors,
            cycleErrors: progress.errors,
          };
        }
        progress.pendingIds = undefined;
        progress.nextCursor = undefined;
        await redis.set(PROGRESS_KEY, progress);
        continue;
      }

      const id = progress.pendingIds[0];
      try {
        // Read current data when resuming, rather than replaying yesterday's event snapshot.
        if (progress.phase === "notion") {
          const event = await getNotionEvent(id);
          if (event) {
            await syncNotionToGcal(event);
            notionEventsSynced++;
          }
        } else {
          const event = await getGcalEvent(id);
          if (
            event?.notionPageId &&
            event.status !== "cancelled" &&
            (await isNotionPageArchived(event.notionPageId))
          ) {
            await deleteFromGcal(id, event.title);
            deletionsFromGcal++;
          }
        }
      } catch (error) {
        errors++;
        progress.errors++;
        console.error(`Fallback sync failed for ${id}:`, error);
        // The next complete reconciliation revisits failed items; do not block other pages.
      }
      progress.pendingIds.shift();
      await redis.set(PROGRESS_KEY, progress);
    }
    return {
      status: "in_progress" as const,
      phase: progress.phase,
      notionEventsSynced,
      deletionsFromGcal,
      errors,
      cycleErrors: progress.errors,
    };
  } finally {
    await release();
  }
}

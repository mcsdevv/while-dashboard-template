import { isRetryableError } from "@/lib/errors";
import { createGcalEvent, deleteGcalEvent, updateGcalEvent } from "@/lib/google-calendar/client";
import { createNotionEvent, deleteNotionEvent, updateNotionEvent } from "@/lib/notion/client";
import { logSync } from "@/lib/sync/logger";
import { retryWithBackoff } from "@/lib/sync/retry";
import type { Event, SyncDirection, SyncOperation } from "@/lib/types";

/**
 * Sync an event from Notion to Google Calendar
 * Handles loop prevention by checking for existing gcalEventId
 */
export async function syncNotionToGcal(event: Event): Promise<void> {
  try {
    const isAllDay =
      event.startTime.getUTCHours() === 0 &&
      event.startTime.getUTCMinutes() === 0 &&
      event.startTime.getUTCSeconds() === 0 &&
      event.endTime.getUTCHours() === 0 &&
      event.endTime.getUTCMinutes() === 0 &&
      event.endTime.getUTCSeconds() === 0;

    console.log(`\n🔄 [Notion→GCal] Processing: "${event.title}"`);
    console.log(`   Notion Page ID: ${event.notionPageId || event.id}`);
    console.log(`   GCal Event ID: ${event.gcalEventId || "none (will create)"}`);
    console.log(`   Start: ${event.startTime.toISOString()}`);
    console.log(`   End: ${event.endTime.toISOString()}`);
    console.log(`   All-day event: ${isAllDay ? "YES" : "NO"}`);

    // Loop prevention: Check if this event already has a GCal ID
    if (event.gcalEventId) {
      // This event already exists in GCal, so UPDATE it
      console.log("   → Updating existing GCal event...");

      try {
        await retryWithBackoff(
          () =>
            updateGcalEvent(event.gcalEventId!, {
              title: event.title,
              description: event.description,
              startTime: event.startTime,
              endTime: event.endTime,
              location: event.location,
              // REMOVED: Don't sync status from Notion to avoid accidental cancellations
              // status: event.status === "confirmed" || event.status === "tentative" ? event.status : undefined,
              reminders: event.reminders,
              notionPageId: event.notionPageId,
            }),
          {
            onRetry: (error, attempt) => {
              console.log(`Retrying updateGcalEvent (attempt ${attempt}):`, error.message);
            },
          },
        );
      } catch (updateError: unknown) {
        // Skip read-only events like birthdays from Google Contacts
        const errorMessage =
          updateError instanceof Error ? updateError.message : String(updateError);
        if (
          errorMessage.includes("birthday") ||
          errorMessage.includes("not valid for this event type")
        ) {
          console.warn(
            `⚠️  Skipping read-only event: "${event.title}" (${event.gcalEventId}) - Cannot modify special Google Calendar event types`,
          );
          // Don't re-throw - just skip this event
          return;
        }
        throw updateError;
      }

      await logSync({
        direction: "notion_to_gcal",
        operation: "update",
        eventId: event.id,
        eventTitle: event.title,
        status: "success",
      });

      console.log(`✓ Updated GCal event: ${event.title} (${event.gcalEventId})`);
    } else {
      // This event doesn't exist in GCal yet, so CREATE it
      const gcalEventId = await retryWithBackoff(
        () =>
          createGcalEvent({
            ...event,
            notionPageId: event.notionPageId || event.id,
          }),
        {
          onRetry: (error, attempt) => {
            console.log(`Retrying createGcalEvent (attempt ${attempt}):`, error.message);
          },
        },
      );

      // Update Notion page with the new GCal event ID
      await retryWithBackoff(
        () =>
          updateNotionEvent(event.notionPageId || event.id, {
            gcalEventId,
          }),
        {
          onRetry: (error, attempt) => {
            console.log(`Retrying updateNotionEvent (attempt ${attempt}):`, error.message);
          },
        },
      );

      await logSync({
        direction: "notion_to_gcal",
        operation: "create",
        eventId: event.id,
        eventTitle: event.title,
        status: "success",
      });

      console.log(`✓ Created GCal event: ${event.title} (${gcalEventId})`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await logSync({
      direction: "notion_to_gcal",
      operation: event.gcalEventId ? "update" : "create",
      eventId: event.id,
      eventTitle: event.title,
      status: "failure",
      error: errorMessage,
    });

    console.error(`✗ Failed to sync Notion event to GCal: ${event.title}`, error);

    // Re-throw if it's not a retryable error, so we can alert
    if (!isRetryableError(error)) {
      throw error;
    }
  }
}

/**
 * Sync an event from Google Calendar to Notion
 * Handles loop prevention by checking for existing notionPageId
 */
export async function syncGcalToNotion(event: Event): Promise<void> {
  try {
    console.log(`\n🔄 [GCal→Notion] Processing: "${event.title}"`);
    console.log(`   GCal Event ID: ${event.gcalEventId || event.id}`);
    console.log(`   Notion Page ID: ${event.notionPageId || "none (will create)"}`);
    console.log(`   Start: ${event.startTime.toISOString()}`);
    console.log(`   End: ${event.endTime.toISOString()}`);

    // Loop prevention: Check if this event already has a Notion page ID
    if (event.notionPageId) {
      // This event already exists in Notion, so UPDATE it
      console.log("   → Updating existing Notion page...");

      try {
        await retryWithBackoff(
          () =>
            updateNotionEvent(event.notionPageId!, {
              title: event.title,
              description: event.description,
              startTime: event.startTime,
              endTime: event.endTime,
              location: event.location,
              // REMOVED: Don't sync status to Notion (Status property was deleted)
              // status: event.status,
              reminders: event.reminders,
              gcalEventId: event.gcalEventId,
            }),
          {
            onRetry: (error, attempt) => {
              console.log(`Retrying updateNotionEvent (attempt ${attempt}):`, error.message);
            },
          },
        );

        await logSync({
          direction: "gcal_to_notion",
          operation: "update",
          eventId: event.id,
          eventTitle: event.title,
          status: "success",
        });

        console.log(`✓ Updated Notion event: ${event.title} (${event.notionPageId})`);
      } catch (updateError: unknown) {
        // If the Notion page is archived/deleted, create a new one instead
        const errorMessage = updateError instanceof Error ? updateError.message : "";
        const errorCode =
          updateError && typeof updateError === "object" && "code" in updateError
            ? String((updateError as { code: unknown }).code)
            : "";

        if (
          errorMessage.includes("archived") ||
          errorCode === "validation_error" ||
          errorCode === "object_not_found"
        ) {
          console.log(
            `⚠️  Notion page ${event.notionPageId} is archived/deleted, creating new page for "${event.title}"`,
          );

          // Create new Notion page
          // Exclude status field since Status property doesn't exist in Notion
          const { status, ...eventWithoutStatus } = event;
          const notionPageId = await retryWithBackoff(
            () =>
              createNotionEvent({
                ...eventWithoutStatus,
                gcalEventId: event.gcalEventId || event.id,
              }),
            {
              onRetry: (error, attempt) => {
                console.log(`Retrying createNotionEvent (attempt ${attempt}):`, error.message);
              },
            },
          );

          // Update GCal event with the new Notion page ID
          await retryWithBackoff(
            () =>
              updateGcalEvent(event.gcalEventId || event.id, {
                notionPageId,
              }),
            {
              onRetry: (error, attempt) => {
                console.log(`Retrying updateGcalEvent (attempt ${attempt}):`, error.message);
              },
            },
          );

          await logSync({
            direction: "gcal_to_notion",
            operation: "create",
            eventId: event.id,
            eventTitle: event.title,
            status: "success",
          });

          console.log(`✓ Created new Notion event: ${event.title} (${notionPageId})`);
          return;
        }
        throw updateError;
      }
    } else {
      // This event doesn't exist in Notion yet, so CREATE it
      // Exclude status field since Status property doesn't exist in Notion
      const { status, ...eventWithoutStatus } = event;
      const notionPageId = await retryWithBackoff(
        () =>
          createNotionEvent({
            ...eventWithoutStatus,
            gcalEventId: event.gcalEventId || event.id,
          }),
        {
          onRetry: (error, attempt) => {
            console.log(`Retrying createNotionEvent (attempt ${attempt}):`, error.message);
          },
        },
      );

      // Update GCal event with the new Notion page ID
      await retryWithBackoff(
        () =>
          updateGcalEvent(event.gcalEventId || event.id, {
            notionPageId,
          }),
        {
          onRetry: (error, attempt) => {
            console.log(`Retrying updateGcalEvent (attempt ${attempt}):`, error.message);
          },
        },
      );

      await logSync({
        direction: "gcal_to_notion",
        operation: "create",
        eventId: event.id,
        eventTitle: event.title,
        status: "success",
      });

      console.log(`✓ Created Notion event: ${event.title} (${notionPageId})`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await logSync({
      direction: "gcal_to_notion",
      operation: event.notionPageId ? "update" : "create",
      eventId: event.id,
      eventTitle: event.title,
      status: "failure",
      error: errorMessage,
    });

    console.error(`✗ Failed to sync GCal event to Notion: ${event.title}`, error);

    // Re-throw if it's not a retryable error
    if (!isRetryableError(error)) {
      throw error;
    }
  }
}

/**
 * Delete an event from Google Calendar (when deleted in Notion)
 */
export async function deleteFromGcal(gcalEventId: string, eventTitle: string): Promise<void> {
  try {
    await retryWithBackoff(() => deleteGcalEvent(gcalEventId), {
      onRetry: (error, attempt) => {
        console.log(`Retrying deleteGcalEvent (attempt ${attempt}):`, error.message);
      },
    });

    await logSync({
      direction: "notion_to_gcal",
      operation: "delete",
      eventId: gcalEventId,
      eventTitle,
      status: "success",
    });

    console.log(`✓ Deleted GCal event: ${eventTitle} (${gcalEventId})`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await logSync({
      direction: "notion_to_gcal",
      operation: "delete",
      eventId: gcalEventId,
      eventTitle,
      status: "failure",
      error: errorMessage,
    });

    console.error(`✗ Failed to delete GCal event: ${eventTitle}`, error);

    if (!isRetryableError(error)) {
      throw error;
    }
  }
}

/**
 * Delete an event from Notion (when deleted in Google Calendar)
 */
export async function deleteFromNotion(notionPageId: string, eventTitle: string): Promise<void> {
  try {
    await retryWithBackoff(() => deleteNotionEvent(notionPageId), {
      onRetry: (error, attempt) => {
        console.log(`Retrying deleteNotionEvent (attempt ${attempt}):`, error.message);
      },
    });

    await logSync({
      direction: "gcal_to_notion",
      operation: "delete",
      eventId: notionPageId,
      eventTitle,
      status: "success",
    });

    console.log(`✓ Deleted Notion event: ${eventTitle} (${notionPageId})`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await logSync({
      direction: "gcal_to_notion",
      operation: "delete",
      eventId: notionPageId,
      eventTitle,
      status: "failure",
      error: errorMessage,
    });

    console.error(`✗ Failed to delete Notion event: ${eventTitle}`, error);

    if (!isRetryableError(error)) {
      throw error;
    }
  }
}

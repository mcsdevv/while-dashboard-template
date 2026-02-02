/**
 * API endpoints for field backfill service.
 * Populates newly-enabled fields (attendees, organizer, etc.) on existing Notion pages
 * using data from their linked Google Calendar events.
 *
 * Uses Next.js `after()` to guarantee background task completion
 * with Vercel Fluid Compute (default 300s timeout, up to 800s on Pro).
 */
import {
  cancelBackfill,
  getBackfillProgress,
  resetBackfill,
  startBackfill,
} from "@/lib/sync/backfill";
import { after } from "next/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Allow up to 5 minutes for backfill (default Fluid Compute limit)
export const maxDuration = 300;

// Valid fields that can be backfilled
const BACKFILL_FIELDS = [
  "attendees",
  "organizer",
  "conferenceLink",
  "recurrence",
  "color",
  "visibility",
  "reminders",
] as const;

// Request body schema for POST
const startBackfillSchema = z.object({
  fields: z.array(z.enum(BACKFILL_FIELDS)).min(1, "At least one field is required"),
});

/**
 * GET /api/sync/backfill/fields
 * Returns current field backfill progress
 */
export async function GET() {
  try {
    const progress = await getBackfillProgress();
    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error getting backfill progress:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/sync/backfill/fields
 * Starts a new field backfill operation (non-blocking)
 * Body: { fields: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const parsed = startBackfillSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { fields } = parsed.data;

    // Check if backfill is already running
    const currentProgress = await getBackfillProgress();
    if (currentProgress.status === "running") {
      return NextResponse.json(
        { error: "Backfill is already running", progress: currentProgress },
        { status: 409 },
      );
    }

    // Schedule background work using Next.js after()
    // Guaranteed to complete within maxDuration (Fluid Compute)
    after(async () => {
      try {
        await startBackfill(fields);
      } catch (error) {
        console.error("Backfill failed:", error);
      }
    });

    // Return immediately with initial status
    return NextResponse.json({
      status: "started",
      fields,
      message: "Backfill started. Use GET to check progress.",
    });
  } catch (error) {
    console.error("Error starting backfill:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/sync/backfill/fields
 * Cancels a running field backfill operation
 */
export async function DELETE() {
  try {
    const progress = await getBackfillProgress();

    if (progress.status !== "running") {
      // If not running, just reset to idle
      await resetBackfill();
      return NextResponse.json({
        status: "reset",
        message: "Backfill was not running. Progress has been reset.",
      });
    }

    await cancelBackfill();
    return NextResponse.json({
      status: "cancelling",
      message: "Backfill cancellation requested. It will stop after the current batch.",
    });
  } catch (error) {
    console.error("Error cancelling backfill:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

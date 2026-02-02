/**
 * API endpoints for historical sync service.
 * Allows users to sync past Google Calendar events to Notion.
 *
 * Uses Next.js `after()` to guarantee background task completion
 * with Vercel Fluid Compute (default 300s timeout, up to 800s on Pro).
 */
import {
  cancelHistoricalSync,
  getHistoricalSyncPreview,
  getHistoricalSyncProgress,
  MAX_HISTORICAL_DAYS,
  resetHistoricalSync,
  startHistoricalSync,
} from "@/lib/sync/historical";
import { after } from "next/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Allow up to 5 minutes for historical sync (default Fluid Compute limit)
// Can be increased to 800s on Pro plan if needed
export const maxDuration = 300;

// Request body schema for POST
const historicalSyncSchema = z.object({
  days: z
    .number()
    .int()
    .min(1, "Days must be at least 1")
    .max(MAX_HISTORICAL_DAYS, `Days cannot exceed ${MAX_HISTORICAL_DAYS}`),
  preview: z.boolean().optional().default(false),
});

/**
 * GET /api/sync/historical
 * Returns current historical sync progress
 */
export async function GET() {
  try {
    const progress = await getHistoricalSyncProgress();
    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error getting historical sync progress:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/sync/historical
 * Starts a new historical sync operation or returns a preview
 * Body: { days: number, preview?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const parsed = historicalSyncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { days, preview } = parsed.data;

    // If preview mode, return event counts without syncing
    if (preview) {
      const previewData = await getHistoricalSyncPreview(days);
      return NextResponse.json({
        status: "preview",
        days,
        ...previewData,
      });
    }

    // Check if historical sync is already running
    const currentProgress = await getHistoricalSyncProgress();
    if (currentProgress.status === "running") {
      return NextResponse.json(
        { error: "Historical sync is already running", progress: currentProgress },
        { status: 409 },
      );
    }

    // Schedule background work using Next.js after()
    // Guaranteed to complete within maxDuration (Fluid Compute)
    after(async () => {
      try {
        await startHistoricalSync(days);
      } catch (error) {
        console.error("Historical sync failed:", error);
      }
    });

    // Return immediately with initial status
    return NextResponse.json({
      status: "started",
      days,
      message: "Historical sync started. Use GET to check progress.",
    });
  } catch (error) {
    console.error("Error starting historical sync:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/sync/historical
 * Cancels a running historical sync operation
 */
export async function DELETE() {
  try {
    const progress = await getHistoricalSyncProgress();

    if (progress.status !== "running") {
      // If not running, just reset to idle
      await resetHistoricalSync();
      return NextResponse.json({
        status: "reset",
        message: "Historical sync was not running. Progress has been reset.",
      });
    }

    await cancelHistoricalSync();
    return NextResponse.json({
      status: "cancelling",
      message: "Historical sync cancellation requested. It will stop after the current batch.",
    });
  } catch (error) {
    console.error("Error cancelling historical sync:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

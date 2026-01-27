import { getSyncMetrics } from "@/lib/sync/logger";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/metrics
 * Returns detailed sync metrics and recent logs
 *
 * Query parameters:
 * - window: Time window for metrics (24h, 7d, 30d, 90d). Default: 24h
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const window = searchParams.get("window") || "24h";

    // Validate window parameter
    const validWindows = ["24h", "7d", "30d", "90d"];
    if (!validWindows.includes(window)) {
      return NextResponse.json(
        { error: "Invalid time window. Must be one of: 24h, 7d, 30d, 90d" },
        { status: 400 },
      );
    }

    const metrics = await getSyncMetrics(window as "24h" | "7d" | "30d" | "90d");

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

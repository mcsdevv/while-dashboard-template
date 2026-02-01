import { getSyncLogs } from "@/lib/sync/logger";
import { type NextRequest, NextResponse } from "next/server";

type TimeWindow = "24h" | "7d" | "30d" | "90d";

const TIME_THRESHOLDS: Record<TimeWindow, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
};

/**
 * GET /api/events
 * Returns all sync operations filtered by time window
 *
 * Query parameters:
 * - window: Time window for filtering (24h, 7d, 30d, 90d). Default: 24h
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const window = searchParams.get("window") || "24h";

    const validWindows = Object.keys(TIME_THRESHOLDS);
    if (!validWindows.includes(window)) {
      return NextResponse.json(
        { error: "Invalid time window. Must be one of: 24h, 7d, 30d, 90d" },
        { status: 400 },
      );
    }

    const logs = await getSyncLogs(500);
    const now = Date.now();
    const threshold = now - TIME_THRESHOLDS[window as TimeWindow];

    const filteredLogs = logs.filter((log) => {
      const logTime =
        typeof log.timestamp === "string"
          ? new Date(log.timestamp).getTime()
          : log.timestamp.getTime();
      return logTime >= threshold;
    });

    return NextResponse.json(filteredLogs);
  } catch (error) {
    console.error("Error fetching events:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

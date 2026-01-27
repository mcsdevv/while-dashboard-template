import { env } from "@/lib/env";
import { getSyncMetrics } from "@/lib/sync/logger";
import { NextResponse } from "next/server";

/**
 * GET /api/status
 * Returns the current sync status and health of the system
 */
export async function GET() {
  try {
    const metrics = await getSyncMetrics();

    // Determine overall health status
    const isHealthy =
      metrics.totalFailures === 0 || metrics.totalSuccess > metrics.totalFailures * 10;

    const status = {
      healthy: isHealthy,
      message: isHealthy ? "System operating normally" : "Some sync failures detected",
      lastSync: {
        notionToGcal: metrics.lastSyncNotionToGcal
          ? new Date(metrics.lastSyncNotionToGcal).toISOString()
          : null,
        gcalToNotion: metrics.lastSyncGcalToNotion
          ? new Date(metrics.lastSyncGcalToNotion).toISOString()
          : null,
      },
      success: metrics.totalSuccess,
      failures: metrics.totalFailures,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching status:", error);

    return NextResponse.json(
      {
        healthy: false,
        message: "Error fetching status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

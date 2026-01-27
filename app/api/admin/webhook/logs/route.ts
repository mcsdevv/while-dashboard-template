import { getWebhookLogs, getWebhookMetrics } from "@/lib/sync/logger";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Verify admin authorization
 */
function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    console.warn("⚠️  ADMIN_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${adminSecret}`;
}

/**
 * GET - View webhook logs and metrics
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get("limit") || "100", 10);

    const [logs, metrics] = await Promise.all([getWebhookLogs(limit), getWebhookMetrics()]);

    return NextResponse.json({
      logs,
      metrics,
      count: logs.length,
    });
  } catch (error) {
    console.error("Error fetching webhook logs:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch logs",
      },
      { status: 500 },
    );
  }
}

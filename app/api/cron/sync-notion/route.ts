import { reconcileNotionEvents } from "@/lib/sync/reconcile";
import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

/** Daily fallback reconciliation. Unfinished work resumes on the next invocation. */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await reconcileNotionEvents();
    return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Fallback reconciliation failed:", error);
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

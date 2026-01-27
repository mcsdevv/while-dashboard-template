import { getRedis } from "@/lib/redis";
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
 * GET - Debug Redis keys
 */
export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: "Redis not configured" }, { status: 503 });
    }

    // Get all webhook-related keys
    const notionWebhook = await redis.get("webhook:notion:subscription");
    const gcalChannel = await redis.get("webhook:gcal:channel");
    const gcalSync = await redis.get("webhook:gcal:sync_state");

    return NextResponse.json({
      redis: {
        notionWebhook,
        gcalChannel,
        gcalSync,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

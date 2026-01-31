import { getNotionWebhook, markNotionWebhookVerified } from "@/lib/webhook/channel-manager";
import { NextResponse } from "next/server";

/**
 * POST /api/setup/sync/verify-notion
 * Manually marks the Notion webhook as verified.
 * Used when user has completed manual webhook setup in Notion UI.
 */
export async function POST() {
  try {
    const existingSubscription = await getNotionWebhook();

    if (!existingSubscription) {
      return NextResponse.json(
        { error: "No Notion webhook subscription found. Click 'Enable Real-Time Sync' first." },
        { status: 400 },
      );
    }

    if (existingSubscription.verified) {
      return NextResponse.json({ success: true, message: "Notion webhook already verified" });
    }

    await markNotionWebhookVerified();

    return NextResponse.json({ success: true, message: "Notion webhook marked as verified" });
  } catch (error) {
    console.error("Error verifying Notion webhook:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify Notion webhook" },
      { status: 500 },
    );
  }
}

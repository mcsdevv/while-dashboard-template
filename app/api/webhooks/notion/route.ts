import crypto from "node:crypto";
import { findGcalEventByNotionId } from "@/lib/google-calendar/client";
import { deleteGcalEvent } from "@/lib/google-calendar/client";
import { getNotionEvent } from "@/lib/notion/client";
import { getNotionConfig } from "@/lib/settings";
import { syncNotionToGcal } from "@/lib/sync/engine";
import { logWebhookEvent } from "@/lib/sync/logger";
import { notionWebhookPayloadSchema, validateSafe } from "@/lib/validation";
import { getNotionWebhook, saveNotionWebhook } from "@/lib/webhook/channel-manager";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Validate HMAC signature from Notion webhook
 * Notion sends signature as: "sha256=<hex_digest>"
 */
function validateSignature(body: string, signature: string, verificationToken: string): boolean {
  const hmac = crypto.createHmac("sha256", verificationToken);
  hmac.update(body);
  const expectedSignature = `sha256=${hmac.digest("hex")}`;

  // Timing-safe comparison
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * POST - Handle Notion webhook notifications
 *
 * Notion sends webhooks for:
 * - Verification (one-time): Contains verification_token to confirm in UI
 * - Events: page.content_updated and other events
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Read and validate body
    const bodyText = await request.text();

    let body: unknown;
    try {
      body = JSON.parse(bodyText);
    } catch (error) {
      console.error("❌ Invalid JSON in Notion webhook");
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Validate payload structure
    const validation = validateSafe(notionWebhookPayloadSchema, body);
    if (!validation.success) {
      console.error("❌ Invalid Notion webhook payload:", validation.error);
      return NextResponse.json(
        { error: "Invalid webhook payload", details: validation.error },
        { status: 400 },
      );
    }

    const validatedBody = validation.data;

    // Handle verification request FIRST (before checking subscription)
    // This is sent by Notion when you create a webhook in their UI
    if (validatedBody.type === "verification") {
      console.log("🔐 Notion webhook verification request received");
      console.log("Verification token:", validatedBody.verification_token);

      await logWebhookEvent({
        type: "setup",
        status: "success",
      });

      // Preserve existing subscription metadata when possible
      const notionConfig = await getNotionConfig();
      const existingSubscription = await getNotionWebhook();

      await saveNotionWebhook({
        subscriptionId: existingSubscription?.subscriptionId || "pending",
        databaseId: existingSubscription?.databaseId || notionConfig.databaseId,
        verificationToken: validatedBody.verification_token,
        createdAt: existingSubscription?.createdAt || new Date(),
        verified: existingSubscription?.verified || false,
      });

      // Notion expects a 200 OK response
      // The user must manually confirm verification in the Notion UI
      return NextResponse.json({
        message: "Verification request received. Please confirm in Notion integration settings.",
        verificationToken: validatedBody.verification_token,
      });
    }

    // For non-verification requests, check if subscription exists
    const subscription = await getNotionWebhook();

    if (!subscription) {
      console.error("❌ No Notion webhook subscription found");
      return NextResponse.json({ error: "No webhook subscription configured" }, { status: 404 });
    }

    // Validate HMAC signature for regular events
    // Notion sends the signature as "X-Notion-Signature" header
    const signature = request.headers.get("x-notion-signature");
    if (!signature) {
      console.error("❌ Missing Notion signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    if (!validateSignature(bodyText, signature, subscription.verificationToken)) {
      console.error("❌ Invalid Notion webhook signature");
      await logWebhookEvent({
        type: "error",
        status: "failure",
        error: "Invalid signature",
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("✅ Notion webhook signature validated");

    // Handle event notifications
    // Notion sends events with type directly as "page.created", "page.content_updated", etc.
    console.log(`📥 Notion webhook event: ${validatedBody.type}`);

    // Handle page.created, page.content_updated, and page.properties_updated events (same logic)
    // Note: page.properties_updated handles property changes like title, date, etc.
    // page.content_updated handles block content changes
    if (
      validatedBody.type === "page.created" ||
      validatedBody.type === "page.content_updated" ||
      validatedBody.type === "page.properties_updated"
    ) {
      const pageId = validatedBody.entity.id;
      const action = validatedBody.type === "page.created" ? "creation" : "update";

      console.log(`🔄 Processing Notion page ${action}: ${pageId}`);

      try {
        // Fetch the page from Notion
        const notionEvent = await getNotionEvent(pageId);

        if (notionEvent) {
          // Sync to Google Calendar (creates or updates)
          await syncNotionToGcal(notionEvent);

          const processingTime = Date.now() - startTime;
          console.log(`✅ Synced Notion → GCal (${action}) in ${processingTime}ms`);

          await logWebhookEvent({
            type: "notification",
            source: "notion",
            webhookEventType: validatedBody.type,
            action: validatedBody.type === "page.created" ? "create" : "update",
            eventTitle: notionEvent.title,
            eventId: pageId,
            status: "success",
            processingTime,
          });
        } else {
          console.warn(`⚠️  Page ${pageId} not found or not an event page`);
        }
      } catch (error) {
        console.error(`Failed to process Notion webhook for page ${pageId}:`, error);
        await logWebhookEvent({
          type: "notification",
          source: "notion",
          webhookEventType: validatedBody.type,
          action: validatedBody.type === "page.created" ? "create" : "update",
          eventId: pageId,
          status: "failure",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      return NextResponse.json({ message: "Event processed" });
    }

    // Handle page.deleted events
    // Find the corresponding GCal event and delete it in real-time
    if (validatedBody.type === "page.deleted") {
      const pageId = validatedBody.entity.id;

      console.log(`🗑️  Notion page deleted: ${pageId}`);
      console.log("🔍 Finding corresponding Google Calendar event...");

      try {
        // Find the GCal event that has this Notion page ID
        const gcalEvent = await findGcalEventByNotionId(pageId);

        if (gcalEvent) {
          console.log(
            `   Found GCal event: "${gcalEvent.title}" (${gcalEvent.gcalEventId || gcalEvent.id})`,
          );

          // Delete from Google Calendar
          await deleteGcalEvent(gcalEvent.gcalEventId || gcalEvent.id);

          const processingTime = Date.now() - startTime;
          console.log(`✅ Deleted from GCal in ${processingTime}ms`);

          await logWebhookEvent({
            type: "notification",
            source: "notion",
            webhookEventType: validatedBody.type,
            action: "delete",
            eventTitle: gcalEvent.title,
            eventId: pageId,
            status: "success",
            processingTime,
          });
        } else {
          console.warn(`⚠️  No GCal event found with Notion page ID: ${pageId}`);
          console.log("ℹ️  Event may have already been deleted or never synced");

          await logWebhookEvent({
            type: "notification",
            source: "notion",
            webhookEventType: validatedBody.type,
            action: "delete",
            eventId: pageId,
            status: "success",
            processingTime: Date.now() - startTime,
          });
        }
      } catch (error) {
        console.error(`Failed to process Notion deletion for page ${pageId}:`, error);
        await logWebhookEvent({
          type: "notification",
          source: "notion",
          webhookEventType: validatedBody.type,
          action: "delete",
          eventId: pageId,
          status: "failure",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      return NextResponse.json({ message: "Event processed" });
    }

    // Unknown webhook type (should never happen due to validation)
    console.warn(`⚠️  Unknown Notion webhook type: ${validatedBody.type}`);
    return NextResponse.json({ message: "Unknown webhook type" });
  } catch (error) {
    console.error("❌ Notion webhook processing failed:", error);

    await logWebhookEvent({
      type: "error",
      status: "failure",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

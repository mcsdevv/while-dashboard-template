import {
  fetchGcalEventsSince,
  setupGcalWebhook,
  stopGcalWebhook,
} from "@/lib/google-calendar/client";
import {
  createNotionWebhook,
  deleteNotionWebhook as deleteNotionWebhookAPI,
  listNotionWebhooks,
} from "@/lib/notion/client";
import { getGoogleConfig, getNotionConfig } from "@/lib/settings";
import {
  deleteNotionWebhook,
  deleteWebhookChannel,
  getNotionWebhook,
  getWebhookChannel,
  isChannelExpired,
  markNotionWebhookVerified,
  saveNotionWebhook,
  saveWebhookChannel,
  updateSyncState,
} from "@/lib/webhook/channel-manager";
import { getSyncStatus } from "@/lib/webhook/status";
import { type NextRequest, NextResponse } from "next/server";

const LOCALHOST_PATTERNS = ["localhost", "127.0.0.1", "::1"];

function isLocalhostRequest(request: NextRequest): boolean {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.hostname;
  if (!host) return false;
  return LOCALHOST_PATTERNS.some((pattern) => host.includes(pattern));
}

function buildWebhookUrl(request: NextRequest, provider: "google" | "notion"): string {
  const envUrl = process.env.WEBHOOK_URL;
  if (envUrl) {
    const lower = envUrl.toLowerCase();
    const matchesGoogle = lower.includes("google-calendar");
    const matchesNotion = lower.includes("notion");

    if ((provider === "google" && matchesGoogle) || (provider === "notion" && matchesNotion)) {
      return envUrl;
    }

    if (!matchesGoogle && !matchesNotion) {
      const base = envUrl.replace(/\/$/, "");
      return `${base}/api/webhooks/${provider === "google" ? "google-calendar" : "notion"}`;
    }
  }

  const origin =
    request.nextUrl.origin ||
    `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("host")}`;

  return `${origin}/api/webhooks/${provider === "google" ? "google-calendar" : "notion"}`;
}

export async function GET() {
  try {
    const status = await getSyncStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching sync status:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch sync status",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (isLocalhostRequest(request)) {
    return NextResponse.json(
      {
        error:
          "Webhooks require a publicly accessible URL. Deploy your app before enabling real-time sync.",
      },
      { status: 400 },
    );
  }

  const googleResult = await setupGoogleWebhook(request);
  const notionResult = await setupNotionWebhook(request);

  return NextResponse.json({
    google: googleResult,
    notion: notionResult,
  });
}

async function setupGoogleWebhook(request: NextRequest): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  expiresAt?: string;
  expiresInHours?: number;
}> {
  try {
    const googleConfig = await getGoogleConfig();
    const webhookUrl = buildWebhookUrl(request, "google");
    const existingChannel = await getWebhookChannel();
    const calendarMismatch =
      existingChannel && existingChannel.calendarId !== googleConfig.calendarId;
    const expired = existingChannel ? isChannelExpired(existingChannel) : false;

    if (existingChannel && !expired && !calendarMismatch) {
      const expiresAt = new Date(existingChannel.expiration).toISOString();
      const expiresInHours = Math.round(
        (existingChannel.expiration - Date.now()) / (1000 * 60 * 60),
      );
      return {
        success: true,
        message: "Google Calendar webhook already active",
        expiresAt,
        expiresInHours,
      };
    }

    if (existingChannel) {
      try {
        await stopGcalWebhook(existingChannel.channelId, existingChannel.resourceId);
      } catch (error) {
        console.warn("Failed to stop existing Google Calendar webhook:", error);
      }
      await deleteWebhookChannel();
    }

    const channelInfo = await setupGcalWebhook(webhookUrl);

    await saveWebhookChannel({
      channelId: channelInfo.channelId,
      resourceId: channelInfo.resourceId,
      expiration: channelInfo.expiration,
      calendarId: googleConfig.calendarId,
      createdAt: new Date(),
      lastRenewedAt: new Date(),
    });

    const result = await fetchGcalEventsSince(undefined);
    if (result.nextSyncToken) {
      await updateSyncState(result.nextSyncToken);
    }

    const expiresAt = new Date(channelInfo.expiration).toISOString();
    const expiresInHours = Math.round((channelInfo.expiration - Date.now()) / (1000 * 60 * 60));

    return {
      success: true,
      message: existingChannel
        ? "Google Calendar webhook refreshed"
        : "Google Calendar webhook created",
      expiresAt,
      expiresInHours,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set up Google webhook",
    };
  }
}

async function setupNotionWebhook(request: NextRequest): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  verificationRequired?: boolean;
  verificationInstructions?: string[];
}> {
  try {
    const notionConfig = await getNotionConfig();
    const webhookUrl = buildWebhookUrl(request, "notion");
    const existingSubscription = await getNotionWebhook();

    if (existingSubscription) {
      let apiWebhooks: Awaited<ReturnType<typeof listNotionWebhooks>>;
      try {
        apiWebhooks = await listNotionWebhooks();
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to check Notion webhooks",
        };
      }

      const matching = apiWebhooks.find(
        (webhook) => webhook.id === existingSubscription.subscriptionId,
      );

      if (matching) {
        if (matching.state === "active") {
          if (!existingSubscription.verified) {
            try {
              await markNotionWebhookVerified();
            } catch (error) {
              console.warn("Failed to mark Notion webhook as verified:", error);
            }
          }
          return {
            success: true,
            message: "Notion webhook already active",
          };
        }

        if (matching.state === "verification_required") {
          return {
            success: true,
            message: "Notion webhook created. Verification required.",
            verificationRequired: true,
            verificationInstructions: [
              "Go to https://www.notion.so/my-integrations",
              "Open your integration and select the Webhooks tab",
              `Verify the webhook for URL: ${webhookUrl}`,
            ],
          };
        }
      }

      if (
        existingSubscription.subscriptionId &&
        existingSubscription.subscriptionId !== "pending"
      ) {
        try {
          await deleteNotionWebhookAPI(existingSubscription.subscriptionId);
        } catch (error) {
          console.warn("Failed to delete existing Notion webhook:", error);
        }
      }

      await deleteNotionWebhook();
    }

    const webhookResponse = await createNotionWebhook({
      url: webhookUrl,
      databaseId: notionConfig.databaseId,
      eventTypes: ["page.content_updated"],
    });

    await saveNotionWebhook({
      subscriptionId: webhookResponse.id,
      databaseId: notionConfig.databaseId,
      verificationToken: "pending",
      createdAt: new Date(),
      verified: false,
    });

    return {
      success: true,
      message: "Notion webhook created. Verification required.",
      verificationRequired: true,
      verificationInstructions: [
        "Go to https://www.notion.so/my-integrations",
        "Open your integration and select the Webhooks tab",
        `Verify the webhook for URL: ${webhookUrl}`,
      ],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set up Notion webhook",
    };
  }
}

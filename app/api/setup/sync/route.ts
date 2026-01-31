import {
  fetchGcalEventsSince,
  setupGcalWebhook,
  stopGcalWebhook,
} from "@/lib/google-calendar/client";
import { getGoogleConfig, getNotionConfig } from "@/lib/settings";
import {
  deleteWebhookChannel,
  getNotionWebhook,
  getWebhookChannel,
  isChannelExpired,
  saveNotionWebhook,
  saveWebhookChannel,
  updateSyncState,
} from "@/lib/webhook/channel-manager";
import { getSyncStatus } from "@/lib/webhook/status";
import { type NextRequest, NextResponse } from "next/server";

const LOCALHOST_PATTERNS = ["localhost", "127.0.0.1", "::1"];

function getRequestHost(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.hostname ||
    null
  );
}

function normalizeHost(host: string | null): string | null {
  if (!host) return null;
  return host.split(":")[0]?.toLowerCase() ?? null;
}

function isLocalhostRequest(request: NextRequest): boolean {
  const host = normalizeHost(getRequestHost(request));
  if (!host) return false;
  return LOCALHOST_PATTERNS.some((pattern) => host.includes(pattern));
}

/**
 * Gets the effective webhook base URL from environment variables.
 * Priority: WEBHOOK_URL > VERCEL_PROJECT_PRODUCTION_URL
 *
 * This allows webhooks to be set up from localhost during development
 * by pointing to the production Vercel URL.
 */
function getWebhookBaseUrl(): string | null {
  // First, check explicit WEBHOOK_URL
  const envUrl = process.env.WEBHOOK_URL;
  if (envUrl) {
    try {
      const url = new URL(envUrl);
      const marker = "/api/webhooks/";
      const markerIndex = url.pathname.indexOf(marker);
      if (markerIndex !== -1) {
        url.pathname = url.pathname.slice(0, markerIndex);
      }
      url.search = "";
      url.hash = "";
      return url.toString().replace(/\/$/, "");
    } catch (error) {
      console.warn("Invalid WEBHOOK_URL; cannot derive base URL.", error);
    }
  }

  // Fallback to Vercel's production URL (automatically set on Vercel deployments)
  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProductionUrl) {
    // VERCEL_PROJECT_PRODUCTION_URL doesn't include protocol
    return `https://${vercelProductionUrl}`;
  }

  return null;
}

/**
 * Checks if the webhook base URL points to a valid external (non-localhost) host.
 */
function hasValidExternalWebhookUrl(): boolean {
  const baseUrl = getWebhookBaseUrl();
  if (!baseUrl) return false;

  try {
    const host = normalizeHost(new URL(baseUrl).hostname);
    if (!host) return false;
    return !LOCALHOST_PATTERNS.some((pattern) => host.includes(pattern));
  } catch {
    return false;
  }
}

function buildWebhookUrl(request: NextRequest, provider: "google" | "notion"): string {
  const webhookPath = `/api/webhooks/${provider === "google" ? "google-calendar" : "notion"}`;

  // First, check explicit WEBHOOK_URL
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
      return `${base}${webhookPath}`;
    }
  }

  // Fallback to Vercel's production URL (useful for localhost development)
  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProductionUrl) {
    return `https://${vercelProductionUrl}${webhookPath}`;
  }

  // Default: use request origin
  const origin =
    request.nextUrl.origin ||
    `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("host")}`;

  return `${origin}${webhookPath}`;
}

export async function GET(request: NextRequest) {
  try {
    if (isLocalhostRequest(request)) {
      const baseUrl = getWebhookBaseUrl();
      if (baseUrl) {
        const baseHost = normalizeHost(new URL(baseUrl).hostname);
        const requestHost = normalizeHost(getRequestHost(request));
        const isRemoteLocalhost =
          baseHost && LOCALHOST_PATTERNS.some((pattern) => baseHost.includes(pattern));

        if (baseHost && !isRemoteLocalhost && baseHost !== requestHost) {
          try {
            const remoteResponse = await fetch(`${baseUrl}/api/setup/sync`, {
              cache: "no-store",
            });
            if (remoteResponse.ok) {
              const remoteStatus = await remoteResponse.json();
              // Include local externalWebhookUrl so the UI knows webhooks can be set up
              const externalWebhookUrl = hasValidExternalWebhookUrl() ? getWebhookBaseUrl() : null;
              return NextResponse.json({
                ...remoteStatus,
                externalWebhookUrl,
              });
            }
            console.warn(
              "Remote sync status check failed:",
              remoteResponse.status,
              await remoteResponse.text(),
            );
          } catch (error) {
            console.warn("Remote sync status check error:", error);
          }
        }
      }
    }

    const status = await getSyncStatus();

    // Include whether external webhook URL is available (for localhost setup guidance)
    const externalWebhookUrl = hasValidExternalWebhookUrl() ? getWebhookBaseUrl() : null;

    return NextResponse.json({
      ...status,
      externalWebhookUrl,
    });
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
  // Allow localhost if WEBHOOK_URL or VERCEL_PROJECT_PRODUCTION_URL provides a valid external URL
  if (isLocalhostRequest(request) && !hasValidExternalWebhookUrl()) {
    return NextResponse.json(
      {
        error:
          "Webhooks require a publicly accessible URL. Either deploy your app, or set WEBHOOK_URL or VERCEL_PROJECT_PRODUCTION_URL to point to your production deployment.",
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

    // If already marked as verified, return success
    if (existingSubscription?.verified) {
      return {
        success: true,
        message: "Notion webhook active",
      };
    }

    // Notion webhooks must be created through the UI, not via API
    // Save a pending record and guide users to create the webhook manually
    if (!existingSubscription) {
      await saveNotionWebhook({
        subscriptionId: "pending",
        databaseId: notionConfig.databaseId,
        verificationToken: "pending",
        createdAt: new Date(),
        verified: false,
      });
    }

    return {
      success: true,
      message: "Notion webhook setup required.",
      verificationRequired: true,
      verificationInstructions: [
        "Go to https://www.notion.so/my-integrations",
        "Open your integration and select the Webhooks tab",
        "Click '+ Create a subscription'",
        `Enter webhook URL: ${webhookUrl}`,
        "Select events: Page content updated, Page created, Page deleted, Page properties updated",
        "Click 'Create' then verify the endpoint when prompted",
      ],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set up Notion webhook",
    };
  }
}

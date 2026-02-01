import { getNotionConfig } from "@/lib/settings";
import {
  type WebhookLog,
  type WebhookMetrics,
  getWebhookLogs,
  getWebhookMetrics,
} from "@/lib/sync/logger";
import {
  type NotionWebhookSubscription,
  type WebhookChannel,
  getNotionWebhook,
  getSyncState,
  getWebhookChannel,
  needsRenewal,
  saveNotionWebhook,
} from "@/lib/webhook/channel-manager";
import { NextResponse } from "next/server";

export interface GoogleWebhookDebugStatus {
  configured: boolean;
  active: boolean;
  expired: boolean;
  needsRenewal: boolean;
  channelId?: string;
  resourceId?: string;
  calendarId?: string;
  expiresAt?: string;
  expiresInHours?: number;
  createdAt?: string;
  lastRenewedAt?: string;
  reason?: string;
}

export interface NotionWebhookDebugStatus {
  configured: boolean;
  active: boolean;
  verified: boolean;
  databaseId?: string;
  verificationToken?: string;
  createdAt?: string;
  reason?: string;
}

export interface SyncStateDebug {
  hasSyncToken: boolean;
  syncTokenPreview?: string;
  lastSync?: string;
}

export interface WebhooksStatusResponse {
  google: GoogleWebhookDebugStatus;
  notion: NotionWebhookDebugStatus;
  syncState: SyncStateDebug;
  metrics: WebhookMetrics;
  logs: WebhookLog[];
  rawState: {
    googleChannel: WebhookChannel | null;
    notionSubscription: NotionWebhookSubscription | null;
  };
}

function formatDate(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined;
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString();
}

async function getGoogleDebugStatus(
  channel: WebhookChannel | null,
): Promise<GoogleWebhookDebugStatus> {
  if (!channel) {
    return {
      configured: false,
      active: false,
      expired: false,
      needsRenewal: false,
      reason: "No Google Calendar webhook configured",
    };
  }

  const now = Date.now();
  const expired = now >= channel.expiration;
  const expiresInHours = Math.max(0, Math.round((channel.expiration - now) / (1000 * 60 * 60)));
  const requiresRenewal = needsRenewal(channel);

  return {
    configured: true,
    active: !expired,
    expired,
    needsRenewal: requiresRenewal,
    channelId: channel.channelId,
    resourceId: channel.resourceId,
    calendarId: channel.calendarId,
    expiresAt: new Date(channel.expiration).toISOString(),
    expiresInHours,
    createdAt: formatDate(channel.createdAt),
    lastRenewedAt: formatDate(channel.lastRenewedAt),
    reason: expired
      ? "Webhook has expired"
      : requiresRenewal
        ? "Webhook needs renewal soon"
        : undefined,
  };
}

async function getNotionDebugStatus(
  subscription: NotionWebhookSubscription | null,
): Promise<NotionWebhookDebugStatus> {
  if (!subscription) {
    return {
      configured: false,
      active: false,
      verified: false,
      reason: "No Notion webhook configured",
    };
  }

  // Fix databaseId if still "pending" by fetching from config
  let databaseId = subscription.databaseId;
  if (databaseId === "pending") {
    try {
      const notionConfig = await getNotionConfig();
      databaseId = notionConfig.databaseId;
      // Update Redis with the correct value
      await saveNotionWebhook({ ...subscription, databaseId });
    } catch {
      // Config not available
    }
  }

  // Use local verified state as source of truth
  // Notion has no public API to query webhook status
  const isActive = subscription.verified;

  return {
    configured: true,
    active: isActive,
    verified: subscription.verified,
    databaseId,
    verificationToken: subscription.verificationToken === "pending" ? "pending" : "set",
    createdAt: formatDate(subscription.createdAt),
    reason: isActive ? undefined : "Webhook verification required",
  };
}

export async function GET() {
  try {
    // Fetch all data in parallel
    const [channel, subscription, syncState, metrics, logs] = await Promise.all([
      getWebhookChannel(),
      getNotionWebhook(),
      getSyncState(),
      getWebhookMetrics(),
      getWebhookLogs(100),
    ]);

    const [googleStatus, notionStatus] = await Promise.all([
      getGoogleDebugStatus(channel),
      getNotionDebugStatus(subscription),
    ]);

    const syncStateDebug: SyncStateDebug = {
      hasSyncToken: !!syncState.syncToken,
      syncTokenPreview: syncState.syncToken ? `${syncState.syncToken.slice(0, 20)}...` : undefined,
      lastSync: formatDate(syncState.lastSync),
    };

    const response: WebhooksStatusResponse = {
      google: googleStatus,
      notion: notionStatus,
      syncState: syncStateDebug,
      metrics,
      logs,
      rawState: {
        googleChannel: channel,
        notionSubscription: subscription,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching webhook status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch webhook status" },
      { status: 500 },
    );
  }
}

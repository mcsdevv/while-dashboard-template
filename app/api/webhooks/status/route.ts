import { listNotionWebhooks } from "@/lib/notion/client";
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
  subscriptionId?: string;
  databaseId?: string;
  verificationToken?: string;
  state?: string;
  apiWebhookUrl?: string;
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
    notionApiWebhooks: Array<{ id: string; state: string; url?: string }>;
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
  apiWebhooks: Array<{ id: string; state: string; url?: string }>,
): Promise<NotionWebhookDebugStatus> {
  if (!subscription) {
    return {
      configured: false,
      active: false,
      verified: false,
      reason: "No Notion webhook configured",
    };
  }

  const matchingWebhook = apiWebhooks.find((w) => w.id === subscription.subscriptionId);
  const apiState = matchingWebhook?.state;
  const isActive = apiState === "active";
  const needsVerification = apiState === "verification_required";

  let reason: string | undefined;
  if (!matchingWebhook) {
    reason = "Webhook not found in Notion API (may have been deleted)";
  } else if (needsVerification) {
    reason = "Webhook requires verification in Notion integrations dashboard";
  } else if (!isActive && apiState) {
    reason = `Webhook state is: ${apiState}`;
  }

  return {
    configured: true,
    active: isActive,
    verified: subscription.verified || isActive,
    subscriptionId: subscription.subscriptionId,
    databaseId: subscription.databaseId,
    verificationToken: subscription.verificationToken === "pending" ? "pending" : "set",
    state: apiState,
    apiWebhookUrl: matchingWebhook?.url,
    createdAt: formatDate(subscription.createdAt),
    reason,
  };
}

export async function GET() {
  try {
    // Fetch all data in parallel
    const [channel, subscription, syncState, metrics, logs, apiWebhooksResult] = await Promise.all([
      getWebhookChannel(),
      getNotionWebhook(),
      getSyncState(),
      getWebhookMetrics(),
      getWebhookLogs(100),
      listNotionWebhooks().catch(() => [] as Array<{ id: string; state: string; url?: string }>),
    ]);

    const [googleStatus, notionStatus] = await Promise.all([
      getGoogleDebugStatus(channel),
      getNotionDebugStatus(subscription, apiWebhooksResult),
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
        notionApiWebhooks: apiWebhooksResult,
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

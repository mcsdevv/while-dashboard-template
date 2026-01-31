"use client";

import { Button, Card, Skeleton } from "@/shared/ui";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { GoogleWebhookCard } from "./google-webhook-card";
import { NotionWebhookCard } from "./notion-webhook-card";
import { RawStateViewer } from "./raw-state-viewer";
import { SyncStateCard } from "./sync-state-card";
import { WebhookLogsTable } from "./webhook-logs-table";
import { WebhookMetricsCard } from "./webhook-metrics-card";

interface WebhooksData {
  google: {
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
  };
  notion: {
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
  };
  syncState: {
    hasSyncToken: boolean;
    syncTokenPreview?: string;
    lastSync?: string;
  };
  metrics: {
    totalNotifications: number;
    totalRenewals: number;
    lastNotification: Date | string | null;
    lastRenewal: Date | string | null;
    errors: number;
    avgProcessingTime: number;
  };
  logs: Array<{
    id: string;
    timestamp: Date | string;
    type: "notification" | "renewal" | "setup" | "error";
    source?: "notion" | "gcal";
    webhookEventType?: string;
    action?: "create" | "update" | "delete";
    eventTitle?: string;
    eventId?: string;
    resourceState?: string;
    channelId?: string;
    messageNumber?: number;
    status: "success" | "failure";
    error?: string;
    processingTime?: number;
  }>;
  rawState: {
    googleChannel: unknown;
    notionSubscription: unknown;
    notionApiWebhooks: unknown;
  };
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-20 w-full mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </Card>
        <Card className="p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-20 w-full mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </Card>
      </div>
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    </div>
  );
}

export function WebhooksPage() {
  const [data, setData] = useState<WebhooksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      const response = await fetch("/api/webhooks/status");
      if (!response.ok) {
        throw new Error("Failed to fetch webhook status");
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load webhook status");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground text-sm mt-1">Loading webhook status...</p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Deep debugging for webhook configuration
          </p>
        </div>
        <Card className="p-8 text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => fetchData()}>Retry</Button>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Deep debugging for webhook configuration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-input"
            />
            Auto-refresh (30s)
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Provider Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GoogleWebhookCard status={data.google} />
        <NotionWebhookCard status={data.notion} />
      </div>

      {/* Sync State */}
      <SyncStateCard syncState={data.syncState} />

      {/* Metrics */}
      <WebhookMetricsCard metrics={data.metrics} />

      {/* Logs Table */}
      <WebhookLogsTable logs={data.logs} />

      {/* Raw State Viewer */}
      <RawStateViewer
        googleChannel={data.rawState.googleChannel}
        notionSubscription={data.rawState.notionSubscription}
        notionApiWebhooks={data.rawState.notionApiWebhooks}
      />
    </div>
  );
}

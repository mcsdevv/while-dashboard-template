import { getRedis } from "@/lib/redis";
import type { SyncDirection, SyncLog, SyncMetrics, SyncOperation } from "@/lib/types";

// Storage keys
const LOGS_KEY = "sync:logs";
const METRICS_KEY = "sync:metrics";
const MAX_LOGS = 500;

// Default metrics structure
const DEFAULT_METRICS = {
  lastSyncNotionToGcal: null as Date | string | null,
  lastSyncGcalToNotion: null as Date | string | null,
  totalSuccess: 0,
  totalFailures: 0,
  operationCounts: {
    creates: 0,
    updates: 0,
    deletes: 0,
  },
  apiQuota: {
    notion: {
      used: 0,
    },
    googleCalendar: {
      used: 0,
    },
  },
};

/**
 * Get current metrics from Redis store
 */
async function getMetricsFromRedis() {
  const redis = getRedis();
  if (!redis) {
    return DEFAULT_METRICS;
  }
  const stored = await redis.get<typeof DEFAULT_METRICS>(METRICS_KEY);
  return stored || DEFAULT_METRICS;
}

/**
 * Log a sync operation
 */
export async function logSync(log: Omit<SyncLog, "id" | "timestamp">): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return; // Silently skip logging when Redis is not configured
  }

  const newLog: SyncLog = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date(),
    ...log,
  };

  // Add to logs list (Upstash Redis automatically serializes objects)
  await redis.lpush(LOGS_KEY, newLog);

  // Trim to keep only MAX_LOGS entries
  await redis.ltrim(LOGS_KEY, 0, MAX_LOGS - 1);

  // Update metrics
  const metrics = await getMetricsFromRedis();

  if (log.status === "success") {
    metrics.totalSuccess++;

    // Update last sync timestamps
    if (log.direction === "notion_to_gcal") {
      metrics.lastSyncNotionToGcal = newLog.timestamp;
    } else {
      metrics.lastSyncGcalToNotion = newLog.timestamp;
    }

    // Update operation counts
    if (log.operation === "create") {
      metrics.operationCounts.creates++;
    } else if (log.operation === "update") {
      metrics.operationCounts.updates++;
    } else if (log.operation === "delete") {
      metrics.operationCounts.deletes++;
    }
  } else {
    metrics.totalFailures++;
  }

  // Increment API quota tracking
  if (log.direction === "notion_to_gcal" || log.direction === "gcal_to_notion") {
    metrics.apiQuota.notion.used++;
    metrics.apiQuota.googleCalendar.used++;
  }

  // Save updated metrics
  await redis.set(METRICS_KEY, metrics);
}

/**
 * Get recent sync logs
 */
export async function getSyncLogs(limit = 100): Promise<SyncLog[]> {
  const redis = getRedis();
  if (!redis) {
    return [];
  }
  const logs = await redis.lrange<SyncLog>(LOGS_KEY, 0, limit - 1);
  // Upstash Redis automatically deserializes JSON
  return logs;
}

/**
 * Get sync metrics with optional time window filtering
 *
 * @param timeWindow - Time window to filter metrics (24h, 7d, 30d, 90d)
 */
export async function getSyncMetrics(
  timeWindow: "24h" | "7d" | "30d" | "90d" = "24h",
): Promise<SyncMetrics> {
  // Get all recent logs (up to 500)
  const allLogs = await getSyncLogs(500);

  // Calculate time threshold based on window
  const now = Date.now();
  const timeThresholds: Record<string, number> = {
    "24h": 24 * 60 * 60 * 1000, // 24 hours in ms
    "7d": 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    "30d": 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    "90d": 90 * 24 * 60 * 60 * 1000, // 90 days in ms
  };

  const threshold = now - timeThresholds[timeWindow];

  // Filter logs by time window
  const filteredLogs = allLogs.filter((log) => {
    const logTime =
      typeof log.timestamp === "string"
        ? new Date(log.timestamp).getTime()
        : log.timestamp.getTime();
    return logTime >= threshold;
  });

  // Calculate metrics from filtered logs
  let totalSuccess = 0;
  let totalFailures = 0;
  let lastSyncNotionToGcal: Date | null = null;
  let lastSyncGcalToNotion: Date | null = null;
  const operationCounts = { creates: 0, updates: 0, deletes: 0 };

  for (const log of filteredLogs) {
    // Count successes and failures
    if (log.status === "success") {
      totalSuccess++;
    } else {
      totalFailures++;
    }

    // Track last sync times
    const logDate = typeof log.timestamp === "string" ? new Date(log.timestamp) : log.timestamp;

    if (log.direction === "notion_to_gcal") {
      if (!lastSyncNotionToGcal || logDate > lastSyncNotionToGcal) {
        lastSyncNotionToGcal = logDate;
      }
    } else if (log.direction === "gcal_to_notion") {
      if (!lastSyncGcalToNotion || logDate > lastSyncGcalToNotion) {
        lastSyncGcalToNotion = logDate;
      }
    }

    // Count operations
    if (log.operation === "create") operationCounts.creates++;
    else if (log.operation === "update") operationCounts.updates++;
    else if (log.operation === "delete") operationCounts.deletes++;
  }

  // Get API quota from stored metrics (not time-filtered)
  const storedMetrics = await getMetricsFromRedis();

  return {
    lastSyncNotionToGcal,
    lastSyncGcalToNotion,
    totalSuccess,
    totalFailures,
    recentLogs: filteredLogs,
    operationCounts,
    apiQuota: storedMetrics.apiQuota, // API quota is not time-filtered
  };
}

/**
 * Clear all logs and reset metrics
 */
export async function clearLogs(): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }
  await redis.del(LOGS_KEY);
  await redis.set(METRICS_KEY, DEFAULT_METRICS);
}

/**
 * Reset API quota counters (call this daily)
 */
export async function resetApiQuota(): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }
  const metrics = await getMetricsFromRedis();
  metrics.apiQuota.notion.used = 0;
  metrics.apiQuota.googleCalendar.used = 0;
  await redis.set(METRICS_KEY, metrics);
}

// Webhook logging
const WEBHOOK_LOGS_KEY = "webhook:logs";
const WEBHOOK_METRICS_KEY = "webhook:metrics";
const MAX_WEBHOOK_LOGS = 500;

export interface WebhookLog {
  id: string;
  timestamp: Date | string;
  type: "notification" | "renewal" | "setup" | "error";
  source?: "notion" | "gcal"; // Which system sent the webhook
  webhookEventType?: string; // Raw webhook event type (e.g., "page.created", "exists", "sync")
  action?: "create" | "update" | "delete"; // What happened to the event
  eventTitle?: string; // Event title (if applicable)
  eventId?: string; // Event ID (Notion page ID or GCal event ID)
  resourceState?: string;
  channelId?: string;
  messageNumber?: number;
  status: "success" | "failure";
  error?: string;
  processingTime?: number;
}

export interface WebhookMetrics {
  totalNotifications: number;
  totalRenewals: number;
  lastNotification: Date | string | null;
  lastRenewal: Date | string | null;
  errors: number;
  avgProcessingTime: number;
}

const DEFAULT_WEBHOOK_METRICS: WebhookMetrics = {
  totalNotifications: 0,
  totalRenewals: 0,
  lastNotification: null,
  lastRenewal: null,
  errors: 0,
  avgProcessingTime: 0,
};

/**
 * Log a webhook event
 */
export async function logWebhookEvent(log: Omit<WebhookLog, "id" | "timestamp">): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return; // Silently skip logging when Redis is not configured
  }

  const newLog: WebhookLog = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date(),
    ...log,
  };

  // Add to logs list
  await redis.lpush(WEBHOOK_LOGS_KEY, newLog);

  // Trim to keep only MAX_WEBHOOK_LOGS
  await redis.ltrim(WEBHOOK_LOGS_KEY, 0, MAX_WEBHOOK_LOGS - 1);

  // Update webhook metrics
  const metrics = (await redis.get<WebhookMetrics>(WEBHOOK_METRICS_KEY)) || DEFAULT_WEBHOOK_METRICS;

  if (log.type === "notification") {
    metrics.totalNotifications++;
    metrics.lastNotification = newLog.timestamp;
    if (log.processingTime) {
      // Update running average
      const totalProcessed = metrics.totalNotifications;
      metrics.avgProcessingTime =
        (metrics.avgProcessingTime * (totalProcessed - 1) + log.processingTime) / totalProcessed;
    }
  }

  if (log.type === "renewal") {
    metrics.totalRenewals++;
    metrics.lastRenewal = newLog.timestamp;
  }

  if (log.status === "failure" || log.type === "error") {
    metrics.errors++;
  }

  await redis.set(WEBHOOK_METRICS_KEY, metrics);
}

/**
 * Get recent webhook logs
 */
export async function getWebhookLogs(limit = 100): Promise<WebhookLog[]> {
  const redis = getRedis();
  if (!redis) {
    return [];
  }
  const logs = await redis.lrange<WebhookLog>(WEBHOOK_LOGS_KEY, 0, limit - 1);
  return logs;
}

/**
 * Get webhook metrics
 */
export async function getWebhookMetrics(): Promise<WebhookMetrics> {
  const redis = getRedis();
  if (!redis) {
    return DEFAULT_WEBHOOK_METRICS;
  }
  const metrics = await redis.get<WebhookMetrics>(WEBHOOK_METRICS_KEY);
  return metrics || DEFAULT_WEBHOOK_METRICS;
}

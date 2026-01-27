import { getRedis } from "@/lib/redis";

// Storage keys
const WEBHOOK_CHANNEL_KEY = "webhook:gcal:channel";
const WEBHOOK_SYNC_STATE_KEY = "webhook:gcal:sync_state";
const NOTION_WEBHOOK_KEY = "webhook:notion:subscription";

// Data structure for webhook channel metadata
export interface WebhookChannel {
  channelId: string;
  resourceId: string;
  expiration: number; // Unix timestamp in milliseconds
  calendarId: string;
  createdAt: Date | string;
  lastRenewedAt: Date | string;
}

// Data structure for sync state (sync tokens)
export interface SyncState {
  syncToken?: string;
  lastSync: Date | string | null;
}

/**
 * Save webhook channel metadata to Redis
 */
export async function saveWebhookChannel(channel: WebhookChannel): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Redis not configured");
  }
  await redis.set(WEBHOOK_CHANNEL_KEY, channel);
}

/**
 * Get webhook channel metadata from Redis
 */
export async function getWebhookChannel(): Promise<WebhookChannel | null> {
  const redis = getRedis();
  if (!redis) {
    return null;
  }
  const channel = await redis.get<WebhookChannel>(WEBHOOK_CHANNEL_KEY);
  return channel;
}

/**
 * Delete webhook channel metadata from Redis
 */
export async function deleteWebhookChannel(): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }
  await redis.del(WEBHOOK_CHANNEL_KEY);
}

/**
 * Check if webhook channel is expired
 */
export function isChannelExpired(channel: WebhookChannel): boolean {
  return Date.now() >= channel.expiration;
}

/**
 * Get time until channel expiration in milliseconds
 */
export function getTimeUntilExpiration(channel: WebhookChannel): number {
  return channel.expiration - Date.now();
}

/**
 * Check if channel needs renewal (expires in less than 6 hours)
 */
export function needsRenewal(channel: WebhookChannel): boolean {
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  return getTimeUntilExpiration(channel) < SIX_HOURS;
}

/**
 * Update sync state (sync token and last sync timestamp)
 */
export async function updateSyncState(syncToken?: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Redis not configured");
  }
  const state: SyncState = {
    syncToken,
    lastSync: new Date(),
  };
  await redis.set(WEBHOOK_SYNC_STATE_KEY, state);
}

/**
 * Get current sync state
 */
export async function getSyncState(): Promise<SyncState> {
  const redis = getRedis();
  if (!redis) {
    return { syncToken: undefined, lastSync: null };
  }
  const state = await redis.get<SyncState>(WEBHOOK_SYNC_STATE_KEY);
  return state || { syncToken: undefined, lastSync: null };
}

/**
 * Clear sync state (force full sync on next webhook)
 */
export async function clearSyncState(): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }
  await redis.del(WEBHOOK_SYNC_STATE_KEY);
}

// ============================================================
// Notion Webhook Subscription Management
// ============================================================

// Data structure for Notion webhook subscription metadata
export interface NotionWebhookSubscription {
  subscriptionId: string;
  databaseId: string;
  verificationToken: string;
  createdAt: Date | string;
  verified: boolean;
}

/**
 * Save Notion webhook subscription metadata to Redis
 */
export async function saveNotionWebhook(subscription: NotionWebhookSubscription): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Redis not configured");
  }
  await redis.set(NOTION_WEBHOOK_KEY, subscription);
}

/**
 * Get Notion webhook subscription metadata from Redis
 */
export async function getNotionWebhook(): Promise<NotionWebhookSubscription | null> {
  const redis = getRedis();
  if (!redis) {
    return null;
  }
  const subscription = await redis.get<NotionWebhookSubscription>(NOTION_WEBHOOK_KEY);
  return subscription;
}

/**
 * Delete Notion webhook subscription metadata from Redis
 */
export async function deleteNotionWebhook(): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }
  await redis.del(NOTION_WEBHOOK_KEY);
}

/**
 * Mark Notion webhook as verified
 */
export async function markNotionWebhookVerified(): Promise<void> {
  const subscription = await getNotionWebhook();
  if (subscription) {
    subscription.verified = true;
    await saveNotionWebhook(subscription);
  }
}

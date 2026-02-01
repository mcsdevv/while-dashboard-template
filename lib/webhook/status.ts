import { getGoogleConfig } from "@/lib/settings";
import {
  getNotionWebhook,
  getWebhookChannel,
  isChannelExpired,
} from "@/lib/webhook/channel-manager";

export interface GoogleWebhookStatus {
  active: boolean;
  reason?: string;
  expiresAt?: string;
  expiresInHours?: number;
  channelId?: string;
  calendarId?: string;
}

export interface NotionWebhookStatus {
  active: boolean;
  verified: boolean;
  reason?: string;
  state?: string;
  subscriptionId?: string;
  /** Verification token for pasting into Notion UI (only shown when verification required) */
  verificationToken?: string;
}

export interface SyncStatus {
  google: GoogleWebhookStatus;
  notion: NotionWebhookStatus;
}

export async function getGoogleWebhookStatus(): Promise<GoogleWebhookStatus> {
  const channel = await getWebhookChannel();

  if (!channel) {
    return {
      active: false,
      reason: "No Google Calendar webhook configured yet.",
    };
  }

  const expiresAt = new Date(channel.expiration).toISOString();
  const expiresInHours = Math.max(
    0,
    Math.round((channel.expiration - Date.now()) / (1000 * 60 * 60)),
  );

  if (isChannelExpired(channel)) {
    return {
      active: false,
      reason: "Google Calendar webhook expired.",
      expiresAt,
      expiresInHours,
      channelId: channel.channelId,
      calendarId: channel.calendarId,
    };
  }

  try {
    const googleConfig = await getGoogleConfig();
    if (googleConfig.calendarId && googleConfig.calendarId !== channel.calendarId) {
      return {
        active: false,
        reason: "Google Calendar webhook is tied to a different calendar.",
        expiresAt,
        expiresInHours,
        channelId: channel.channelId,
        calendarId: channel.calendarId,
      };
    }
  } catch (error) {
    return {
      active: false,
      reason: error instanceof Error ? error.message : "Google Calendar configuration is missing.",
      expiresAt,
      expiresInHours,
      channelId: channel.channelId,
      calendarId: channel.calendarId,
    };
  }

  return {
    active: true,
    expiresAt,
    expiresInHours,
    channelId: channel.channelId,
    calendarId: channel.calendarId,
  };
}

export async function getNotionWebhookStatus(): Promise<NotionWebhookStatus> {
  const subscription = await getNotionWebhook();

  if (!subscription) {
    return {
      active: false,
      verified: false,
      reason: "No Notion webhook configured yet.",
    };
  }

  // Trust local verified state - we set this when we receive valid signed events
  // or when user clicks "I've completed the setup"
  // Note: Notion has no public API to query webhook status, so we rely on local state
  if (subscription.verified) {
    return {
      active: true,
      verified: true,
      subscriptionId: subscription.subscriptionId,
    };
  }

  // Not verified yet - show verification instructions
  const token =
    subscription.verificationToken !== "pending" ? subscription.verificationToken : undefined;

  return {
    active: false,
    verified: false,
    state: "verification_required",
    subscriptionId: subscription.subscriptionId,
    verificationToken: token,
    reason: "Notion webhook verification required.",
  };
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const [google, notion] = await Promise.all([getGoogleWebhookStatus(), getNotionWebhookStatus()]);
  return { google, notion };
}

import { listNotionWebhooks } from "@/lib/notion/client";
import { getGoogleConfig } from "@/lib/settings";
import {
  getNotionWebhook,
  getWebhookChannel,
  isChannelExpired,
  markNotionWebhookVerified,
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

  try {
    const apiWebhooks = await listNotionWebhooks();
    const matching = apiWebhooks.find((webhook) => webhook.id === subscription.subscriptionId);

    if (!matching) {
      return {
        active: false,
        verified: subscription.verified,
        subscriptionId: subscription.subscriptionId,
        reason: "Notion webhook not found in the Notion API.",
      };
    }

    const state = matching.state;
    const isActive = state === "active";
    const verified = subscription.verified || isActive;

    if (isActive && !subscription.verified) {
      try {
        await markNotionWebhookVerified();
      } catch (error) {
        console.warn("Failed to mark Notion webhook as verified:", error);
      }
    }

    if (!isActive) {
      return {
        active: false,
        verified,
        state,
        subscriptionId: subscription.subscriptionId,
        reason:
          state === "verification_required"
            ? "Notion webhook verification required."
            : `Notion webhook state is ${state}.`,
      };
    }

    if (!verified) {
      return {
        active: false,
        verified: false,
        state,
        subscriptionId: subscription.subscriptionId,
        reason: "Notion webhook verification required.",
      };
    }

    return {
      active: true,
      verified: true,
      state,
      subscriptionId: subscription.subscriptionId,
    };
  } catch (error) {
    return {
      active: false,
      verified: subscription.verified,
      subscriptionId: subscription.subscriptionId,
      reason: error instanceof Error ? error.message : "Unable to verify Notion webhook status.",
    };
  }
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const [google, notion] = await Promise.all([getGoogleWebhookStatus(), getNotionWebhookStatus()]);
  return { google, notion };
}

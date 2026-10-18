import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { setupGcalWebhook, stopGcalWebhook } from "@/lib/google-calendar/client";
import { getWebhookChannel, needsRenewal, saveWebhookChannel } from "@/lib/webhook/channel-manager";
import { acquireLock } from "@/lib/webhook/lock";
import { GET } from "./route";

vi.mock("@/lib/google-calendar/client", () => ({
  setupGcalWebhook: vi.fn(),
  stopGcalWebhook: vi.fn(),
}));
vi.mock("@/lib/settings", () => ({ getGoogleConfig: async () => ({ calendarId: "calendar" }) }));
vi.mock("@/lib/webhook/lock", () => ({ acquireLock: vi.fn() }));
vi.mock("@/lib/webhook/channel-manager", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/webhook/channel-manager")>()),
  getWebhookChannel: vi.fn(),
  saveWebhookChannel: vi.fn(),
}));

const channel = {
  channelId: "old-channel",
  resourceId: "old-resource",
  calendarId: "calendar",
  createdAt: new Date(),
  lastRenewedAt: new Date(),
  expiration: 0,
};
const replacement = {
  channelId: "new-channel",
  resourceId: "new-resource",
  expiration: Date.now() + 7 * 86400000,
};
const request = () => new NextRequest("https://example.com/api/cron/renew-webhook");

describe("daily webhook renewal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.stubEnv("CRON_SECRET", "");
    vi.mocked(acquireLock).mockResolvedValue(vi.fn().mockResolvedValue(undefined));
    vi.mocked(getWebhookChannel).mockResolvedValue({
      ...channel,
      expiration: Date.now() + 30 * 3600000,
    });
    vi.mocked(setupGcalWebhook).mockResolvedValue(replacement);
    vi.mocked(stopGcalWebhook).mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  test("renews with enough lead time for a once-daily schedule", () => {
    expect(needsRenewal({ ...channel, expiration: Date.now() + 30 * 3600000 })).toBe(true);
    expect(needsRenewal({ ...channel, expiration: Date.now() + 48 * 3600000 })).toBe(false);
  });

  test("stores the replacement before stopping the working channel", async () => {
    expect((await GET(request())).status).toBe(200);
    expect(saveWebhookChannel).toHaveBeenCalledWith(expect.objectContaining(replacement));
    expect(vi.mocked(saveWebhookChannel).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(stopGcalWebhook).mock.invocationCallOrder[0],
    );
    expect(stopGcalWebhook).toHaveBeenCalledExactlyOnceWith("old-channel", "old-resource");
  });

  test("keeps the working channel if creating a replacement fails", async () => {
    vi.mocked(setupGcalWebhook).mockRejectedValue(new Error("timeout"));
    expect((await GET(request())).status).toBe(500);
    expect(stopGcalWebhook).not.toHaveBeenCalled();
    expect(saveWebhookChannel).not.toHaveBeenCalled();
  });

  test("cleans up an unstored replacement without stopping the working channel", async () => {
    vi.mocked(saveWebhookChannel).mockRejectedValue(new Error("Redis unavailable"));
    expect((await GET(request())).status).toBe(500);
    expect(stopGcalWebhook).toHaveBeenCalledExactlyOnceWith("new-channel", "new-resource");
  });

  test("checks cron authorization before touching webhooks", async () => {
    vi.stubEnv("CRON_SECRET", "secret");
    expect((await GET(request())).status).toBe(401);
    expect(acquireLock).not.toHaveBeenCalled();
  });
});

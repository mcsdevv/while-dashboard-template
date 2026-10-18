import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { fetchGcalEventsSince } from "@/lib/google-calendar/client";
import { getNotionEvent } from "@/lib/notion/client";
import { syncGcalToNotion, syncNotionToGcal } from "@/lib/sync/engine";
import {
  getSyncState,
  getWebhookChannel,
  getNotionWebhook,
  updateSyncState,
} from "@/lib/webhook/channel-manager";
import { acquireLock } from "@/lib/webhook/lock";
import { POST as googlePost } from "./google-calendar/route";
import { POST as notionPost } from "./notion/route";

const redis = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
const release = vi.hoisted(() => vi.fn());
vi.mock("@/lib/redis", () => ({ getRedis: () => redis }));
vi.mock("@/lib/settings", () => ({ getNotionConfig: vi.fn() }));
vi.mock("@/lib/google-calendar/client", () => ({
  fetchGcalEventsSince: vi.fn(),
  findGcalEventByNotionId: vi.fn(),
  deleteGcalEvent: vi.fn(),
}));
vi.mock("@/lib/notion/client", () => ({ getNotionEvent: vi.fn() }));
vi.mock("@/lib/sync/engine", () => ({
  syncGcalToNotion: vi.fn(),
  syncNotionToGcal: vi.fn(),
  deleteFromNotion: vi.fn(),
}));
vi.mock("@/lib/sync/logger", () => ({ logWebhookEvent: vi.fn() }));
vi.mock("@/lib/webhook/channel-manager", () => ({
  getSyncState: vi.fn(),
  getWebhookChannel: vi.fn(),
  getNotionWebhook: vi.fn(),
  updateSyncState: vi.fn(),
  markNotionWebhookVerified: vi.fn(),
  saveNotionWebhook: vi.fn(),
}));
vi.mock("@/lib/webhook/lock", () => ({ acquireLock: vi.fn() }));

const event = {
  id: "event-1",
  notionPageId: "page-1",
  title: "Meeting",
  startTime: new Date(),
  endTime: new Date(),
};
function googleRequest(resourceId = "resource-1") {
  return new NextRequest("https://example.com/api/webhooks/google-calendar", {
    method: "POST",
    headers: {
      "x-goog-resource-state": "exists",
      "x-goog-channel-id": "channel-1",
      "x-goog-resource-id": resourceId,
      "x-goog-message-number": "42",
    },
  });
}
function notionRequest(type = "page.properties_updated", signature?: string) {
  const body = JSON.stringify({ type, entity: { id: "12345678-1234-4234-9234-123456789012" } });
  const signed =
    signature ?? `sha256=${createHmac("sha256", "verification-token").update(body).digest("hex")}`;
  return new NextRequest("https://example.com/api/webhooks/notion", {
    method: "POST",
    body,
    headers: { "x-notion-signature": signed },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  redis.get.mockResolvedValue(null);
  release.mockResolvedValue(undefined);
  vi.mocked(acquireLock).mockResolvedValue(release);
  vi.mocked(getWebhookChannel).mockResolvedValue({
    channelId: "channel-1",
    resourceId: "resource-1",
    expiration: Date.now() + 10000,
    calendarId: "calendar",
    createdAt: new Date(),
    lastRenewedAt: new Date(),
  });
  vi.mocked(getSyncState).mockResolvedValue({ syncToken: "old-token", lastSync: null });
  vi.mocked(fetchGcalEventsSince).mockResolvedValue({
    events: [event],
    nextSyncToken: "new-token",
  });
  vi.mocked(getNotionWebhook).mockResolvedValue({
    verified: true,
    subscriptionId: "subscription",
    databaseId: "database",
    verificationToken: "verification-token",
    createdAt: new Date(),
  });
  vi.mocked(getNotionEvent).mockResolvedValue(event);
});

describe("Google webhook delivery", () => {
  test("checks both channel and resource identity", async () => {
    expect((await googlePost(googleRequest("wrong-resource"))).status).toBe(401);
    expect(fetchGcalEventsSince).not.toHaveBeenCalled();
  });

  test("retains the token and message on failure while continuing other events", async () => {
    vi.mocked(fetchGcalEventsSince).mockResolvedValue({
      events: [event, event],
      nextSyncToken: "new-token",
    });
    vi.mocked(syncGcalToNotion).mockRejectedValueOnce(new Error("timeout"));
    expect((await googlePost(googleRequest())).status).toBe(500);
    expect(syncGcalToNotion).toHaveBeenCalledTimes(2);
    expect(updateSyncState).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalled();
  });

  test("can retry the same message after a failed attempt", async () => {
    vi.mocked(syncGcalToNotion).mockRejectedValueOnce(new Error("timeout"));
    expect((await googlePost(googleRequest())).status).toBe(500);
    expect((await googlePost(googleRequest())).status).toBe(200);
    expect(updateSyncState).toHaveBeenCalledExactlyOnceWith("new-token");
    expect(redis.set).toHaveBeenCalledExactlyOnceWith("webhook:processed:channel-1:42", true, {
      ex: 300,
    });
    expect(vi.mocked(updateSyncState).mock.invocationCallOrder[0]).toBeLessThan(
      redis.set.mock.invocationCallOrder[0],
    );
  });

  test("acknowledges duplicates only after a previous successful delivery", async () => {
    redis.get.mockResolvedValue(true);
    expect(await (await googlePost(googleRequest())).json()).toEqual({
      status: "duplicate_skipped",
    });
    expect(fetchGcalEventsSince).not.toHaveBeenCalled();
  });

  test("returns a retryable response while another notification owns the token", async () => {
    vi.mocked(acquireLock).mockResolvedValue(null);
    expect((await googlePost(googleRequest())).status).toBe(503);
    expect(updateSyncState).not.toHaveBeenCalled();
  });

  test("processes the replacement full-sync result before committing its token", async () => {
    vi.mocked(fetchGcalEventsSince)
      .mockResolvedValueOnce({ events: [], invalidToken: true })
      .mockResolvedValueOnce({ events: [event], nextSyncToken: "replacement-token" });
    expect((await googlePost(googleRequest())).status).toBe(200);
    expect(fetchGcalEventsSince).toHaveBeenNthCalledWith(2, undefined);
    expect(syncGcalToNotion).toHaveBeenCalledWith(event);
    expect(updateSyncState).toHaveBeenCalledWith("replacement-token");
  });

  test("does not acknowledge an incomplete calendar listing", async () => {
    vi.mocked(fetchGcalEventsSince).mockResolvedValue({ events: [] });
    expect((await googlePost(googleRequest())).status).toBe(500);
    expect(redis.set).not.toHaveBeenCalled();
  });
});

describe("Notion webhook delivery", () => {
  test("returns 500 for a failed event so Notion can retry it", async () => {
    vi.mocked(syncNotionToGcal).mockRejectedValue(new Error("timeout"));
    expect((await notionPost(notionRequest())).status).toBe(500);
  });

  test("returns 500 for a failed deletion", async () => {
    const { findGcalEventByNotionId } = await import("@/lib/google-calendar/client");
    vi.mocked(findGcalEventByNotionId).mockRejectedValue(new Error("timeout"));
    expect((await notionPost(notionRequest("page.deleted"))).status).toBe(500);
  });

  test("rejects a malformed signature without treating it as a server failure", async () => {
    expect((await notionPost(notionRequest("page.properties_updated", "bad"))).status).toBe(401);
    expect(syncNotionToGcal).not.toHaveBeenCalled();
  });
});

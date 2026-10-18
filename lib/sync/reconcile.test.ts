import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { fetchNotionEventsPage, getNotionEvent, isNotionPageArchived } from "@/lib/notion/client";
import { fetchGcalEventsPage, getGcalEvent } from "@/lib/google-calendar/client";
import { deleteFromGcal, syncNotionToGcal } from "@/lib/sync/engine";
import { acquireLock } from "@/lib/webhook/lock";
import { reconcileNotionEvents } from "./reconcile";

const store = vi.hoisted(() => new Map<string, unknown>());
const release = vi.hoisted(() => vi.fn());
vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    get: async (key: string) => structuredClone(store.get(key) ?? null),
    set: async (key: string, value: unknown) => {
      store.set(key, structuredClone(value));
    },
    del: async (key: string) => store.delete(key),
  }),
}));
vi.mock("@/lib/settings", () => ({
  getNotionConfig: async () => ({ databaseId: "database" }),
  getGoogleConfig: async () => ({ calendarId: "calendar" }),
}));
vi.mock("@/lib/webhook/lock", () => ({ acquireLock: vi.fn() }));
vi.mock("@/lib/notion/client", () => ({
  fetchNotionEventsPage: vi.fn(),
  getNotionEvent: vi.fn(),
  isNotionPageArchived: vi.fn(),
}));
vi.mock("@/lib/google-calendar/client", () => ({
  fetchGcalEventsPage: vi.fn(),
  getGcalEvent: vi.fn(),
}));
vi.mock("@/lib/sync/engine", () => ({ deleteFromGcal: vi.fn(), syncNotionToGcal: vi.fn() }));

const event = {
  id: "page-1",
  notionPageId: "page-1",
  gcalEventId: "gcal-1",
  title: "Meeting",
  startTime: new Date(),
  endTime: new Date(),
};
const KEY = "sync:notion:reconciliation";

describe("resumable fallback", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    store.clear();
    vi.useFakeTimers();
    vi.mocked(acquireLock).mockResolvedValue(release);
    vi.mocked(fetchNotionEventsPage).mockResolvedValue({ events: [], nextCursor: undefined });
    vi.mocked(fetchGcalEventsPage).mockResolvedValue({ events: [], nextCursor: undefined });
    vi.mocked(getNotionEvent).mockResolvedValue(event);
    vi.mocked(getGcalEvent).mockResolvedValue(event);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("resumes within a page without replaying earlier items", async () => {
    vi.mocked(fetchNotionEventsPage).mockResolvedValueOnce({
      events: [event, { ...event, id: "page-2", notionPageId: "page-2" }],
      nextCursor: "next-page",
    });
    vi.mocked(syncNotionToGcal).mockImplementationOnce(async () => {
      vi.setSystemTime(Date.now() + 101);
    });
    expect((await reconcileNotionEvents(100)).status).toBe("in_progress");
    expect(store.get(KEY)).toEqual(expect.objectContaining({ pendingIds: ["page-2"] }));
    expect((await reconcileNotionEvents(100)).status).toBe("success");
    expect(getNotionEvent).toHaveBeenNthCalledWith(1, "page-1");
    expect(getNotionEvent).toHaveBeenNthCalledWith(2, "page-2");
    expect(fetchNotionEventsPage).toHaveBeenNthCalledWith(2, "next-page");
    expect(store.has(KEY)).toBe(false);
  });

  test("deletes only after confirming an explicit Notion archive", async () => {
    vi.mocked(fetchGcalEventsPage).mockResolvedValueOnce({
      events: [event],
      nextCursor: undefined,
    });
    vi.mocked(isNotionPageArchived).mockResolvedValue(true);
    expect((await reconcileNotionEvents()).status).toBe("success");
    expect(deleteFromGcal).toHaveBeenCalledWith("gcal-1", "Meeting");
  });

  test("does not delete an active page that was missing from a query", async () => {
    vi.mocked(fetchGcalEventsPage).mockResolvedValueOnce({
      events: [event],
      nextCursor: undefined,
    });
    vi.mocked(isNotionPageArchived).mockResolvedValue(false);
    await reconcileNotionEvents();
    expect(deleteFromGcal).not.toHaveBeenCalled();
  });

  test("reports permission failures without deleting calendar events", async () => {
    vi.mocked(fetchGcalEventsPage).mockResolvedValueOnce({
      events: [event],
      nextCursor: undefined,
    });
    vi.mocked(isNotionPageArchived).mockRejectedValue(new Error("Not found"));
    expect(await reconcileNotionEvents()).toEqual(
      expect.objectContaining({ status: "partial", errors: 1 }),
    );
    expect(deleteFromGcal).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalled();
  });

  test("continues after one event fails and reports the failure", async () => {
    vi.mocked(fetchNotionEventsPage).mockResolvedValueOnce({
      events: [event, event],
      nextCursor: undefined,
    });
    vi.mocked(syncNotionToGcal).mockRejectedValueOnce(new Error("timeout"));
    expect(await reconcileNotionEvents()).toEqual(
      expect.objectContaining({ status: "partial", notionEventsSynced: 1, errors: 1 }),
    );
  });

  test("does not overlap a running reconciliation", async () => {
    vi.mocked(acquireLock).mockResolvedValue(null);
    expect(await reconcileNotionEvents()).toEqual({ status: "already_running" });
    expect(fetchNotionEventsPage).not.toHaveBeenCalled();
  });

  test("does not reuse cursors after changing the configured database", async () => {
    store.set(KEY, { scope: "old:calendar", phase: "notion", cursor: "old-cursor" });
    await reconcileNotionEvents();
    expect(fetchNotionEventsPage).toHaveBeenCalledWith(undefined);
  });

  test("keeps the checkpoint and releases the lock on a failed page fetch", async () => {
    store.set(KEY, {
      scope: "database:calendar",
      phase: "notion",
      cursor: "cursor",
      startedAt: new Date().toISOString(),
      errors: 0,
    });
    vi.mocked(fetchNotionEventsPage).mockRejectedValue(new Error("timeout"));
    await expect(reconcileNotionEvents()).rejects.toThrow("timeout");
    expect(store.get(KEY)).toEqual(expect.objectContaining({ cursor: "cursor" }));
    expect(release).toHaveBeenCalled();
  });
});

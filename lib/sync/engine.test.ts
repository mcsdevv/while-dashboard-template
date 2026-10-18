import { beforeEach, describe, expect, test, vi } from "vitest";
import { NetworkError } from "@/lib/errors";
import {
  createNotionEvent,
  findNotionEventByGcalId,
  updateNotionEvent,
  deleteNotionEvent,
} from "@/lib/notion/client";
import {
  createGcalEvent,
  findGcalEventByNotionId,
  updateGcalEvent,
} from "@/lib/google-calendar/client";
import { logSync } from "@/lib/sync/logger";
import { deleteFromNotion, syncGcalToNotion, syncNotionToGcal } from "./engine";

vi.mock("@/lib/google-calendar/client", () => ({
  createGcalEvent: vi.fn(),
  deleteGcalEvent: vi.fn(),
  updateGcalEvent: vi.fn(),
  findGcalEventByNotionId: vi.fn(),
}));
vi.mock("@/lib/notion/client", () => ({
  createNotionEvent: vi.fn(),
  deleteNotionEvent: vi.fn(),
  updateNotionEvent: vi.fn(),
  findNotionEventByGcalId: vi.fn(),
}));
vi.mock("@/lib/sync/logger", () => ({ logSync: vi.fn() }));
vi.mock("@/lib/sync/retry", () => ({ retryWithBackoff: (fn: () => Promise<unknown>) => fn() }));

const event = {
  id: "gcal-1",
  gcalEventId: "gcal-1",
  notionPageId: "page-1",
  title: "Meeting",
  startTime: new Date("2026-10-18T10:00:00Z"),
  endTime: new Date("2026-10-18T11:00:00Z"),
};

describe("sync failure handling", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("reports an exhausted retry to callers instead of acknowledging a lost update", async () => {
    vi.mocked(updateGcalEvent).mockRejectedValue(new NetworkError("timeout"));
    await expect(syncNotionToGcal(event)).rejects.toThrow("timeout");
    expect(logSync).toHaveBeenCalledWith(expect.objectContaining({ status: "failure" }));
  });

  test("reports exhausted deletion retries", async () => {
    vi.mocked(deleteNotionEvent).mockRejectedValue(new NetworkError("timeout"));
    await expect(deleteFromNotion("page-1", "Meeting")).rejects.toThrow("timeout");
  });

  test("does not create duplicate pages for property validation errors", async () => {
    vi.mocked(updateNotionEvent).mockRejectedValue(
      Object.assign(new Error("Invalid property"), { code: "validation_error" }),
    );
    await expect(syncGcalToNotion(event)).rejects.toThrow("Invalid property");
    expect(createNotionEvent).not.toHaveBeenCalled();
  });

  test("recovers a created Notion page when its Google backlink could not be saved", async () => {
    vi.mocked(findNotionEventByGcalId).mockResolvedValueOnce(null).mockResolvedValueOnce(event);
    vi.mocked(createNotionEvent).mockResolvedValue("page-1");
    vi.mocked(updateGcalEvent).mockRejectedValueOnce(new Error("timeout"));
    const unlinked = { ...event, notionPageId: undefined };
    await expect(syncGcalToNotion(unlinked)).rejects.toThrow("timeout");
    await syncGcalToNotion(unlinked);
    expect(createNotionEvent).toHaveBeenCalledTimes(1);
    expect(updateNotionEvent).toHaveBeenCalledWith(
      "page-1",
      expect.objectContaining({ title: "Meeting" }),
    );
  });

  test("recovers a Google event when its Notion backlink could not be saved", async () => {
    vi.mocked(findGcalEventByNotionId).mockResolvedValueOnce(null).mockResolvedValueOnce(event);
    vi.mocked(createGcalEvent).mockResolvedValue("gcal-1");
    vi.mocked(updateNotionEvent).mockRejectedValueOnce(new Error("timeout"));
    const unlinked = { ...event, gcalEventId: undefined };
    await expect(syncNotionToGcal(unlinked)).rejects.toThrow("timeout");
    await syncNotionToGcal(unlinked);
    expect(createGcalEvent).toHaveBeenCalledTimes(1);
  });
});

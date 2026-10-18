import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  fetchGcalEvents,
  fetchGcalEventsSince,
  findGcalEventByNotionId,
  resetGcalClient,
  updateGcalEvent,
} from "./client";

const api = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn(), list: vi.fn() }));
vi.mock("@googleapis/calendar", () => ({ calendar: () => ({ events: api }) }));
vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    setCredentials() {}
  },
}));
vi.mock("@/lib/settings", () => ({
  GCAL_COLORS: {},
  getGoogleConfig: async () => ({
    clientId: "client",
    clientSecret: "secret",
    refreshToken: "token",
    calendarId: "calendar",
  }),
}));

const event = {
  id: "event-1",
  summary: "Meeting",
  start: { dateTime: "2026-10-18T11:00:00+01:00", timeZone: "Europe/London" },
  end: { dateTime: "2026-10-18T12:00:00+01:00", timeZone: "Europe/London" },
  extendedProperties: { private: { notion_page_id: "page-1", other: "preserved" } },
};

describe("Google Calendar reconciliation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetGcalClient();
    api.get.mockResolvedValue({ data: event });
  });

  test("does not echo an unchanged event back to Google", async () => {
    await updateGcalEvent("event-1", {
      title: "Meeting",
      startTime: new Date("2026-10-18T10:00:00Z"),
      endTime: new Date("2026-10-18T11:00:00Z"),
      notionPageId: "page-1",
      description: "",
    });
    expect(api.patch).not.toHaveBeenCalled();
  });

  test("writes an actual edit", async () => {
    await updateGcalEvent("event-1", { title: "Rescheduled meeting" });
    expect(api.patch).toHaveBeenCalledWith(
      expect.objectContaining({ requestBody: { summary: "Rescheduled meeting" } }),
    );
  });

  test("does not discard a failed destination read", async () => {
    api.get.mockRejectedValue(new Error("timeout"));
    await expect(updateGcalEvent("event-1", { title: "Meeting" })).rejects.toThrow("timeout");
    expect(api.patch).not.toHaveBeenCalled();
  });

  test("reads every page of a calendar listing", async () => {
    api.list
      .mockResolvedValueOnce({ data: { items: [event], nextPageToken: "page-2" } })
      .mockResolvedValueOnce({ data: { items: [{ ...event, id: "event-2" }] } });
    expect(await fetchGcalEvents()).toHaveLength(2);
    expect(api.list.mock.calls[1][0]).toEqual(expect.objectContaining({ pageToken: "page-2" }));
  });

  test("uses the original sync token on every page and returns the final token", async () => {
    api.list
      .mockResolvedValueOnce({ data: { items: [event], nextPageToken: "page-2" } })
      .mockResolvedValueOnce({
        data: { items: [{ ...event, id: "event-2" }], nextSyncToken: "new-token" },
      });
    const result = await fetchGcalEventsSince("old-token");
    expect(result.events).toHaveLength(2);
    expect(result.nextSyncToken).toBe("new-token");
    expect(api.list.mock.calls[1][0]).toEqual(
      expect.objectContaining({ pageToken: "page-2", syncToken: "old-token" }),
    );
  });

  test("discards partial results if a later page invalidates the sync token", async () => {
    api.list
      .mockResolvedValueOnce({ data: { items: [event], nextPageToken: "page-2" } })
      .mockRejectedValueOnce(Object.assign(new Error("Gone"), { code: 410 }));
    expect(await fetchGcalEventsSince("old-token")).toEqual({ events: [], invalidToken: true });
  });

  test("recovers Google events by metadata without scanning the calendar", async () => {
    api.list.mockResolvedValue({ data: { items: [event] } });
    expect((await findGcalEventByNotionId("page-1"))?.gcalEventId).toBe("event-1");
    expect(api.list).toHaveBeenCalledExactlyOnceWith({
      calendarId: "calendar",
      privateExtendedProperty: ["notion_page_id=page-1"],
      maxResults: 1,
    });
  });
});

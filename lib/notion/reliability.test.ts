import { beforeEach, describe, expect, test, vi } from "vitest";
import { DEFAULT_EXTENDED_FIELD_MAPPING } from "@/lib/settings/types";
import {
  fetchNotionEvents,
  findNotionEventByGcalId,
  getNotionEvent,
  isNotionPageArchived,
  resetNotionClient,
  updateNotionEvent,
} from "./client";

const api = vi.hoisted(() => ({ retrieve: vi.fn(), update: vi.fn(), query: vi.fn() }));
vi.mock("@notionhq/client", () => ({
  Client: class {
    pages = api;
    databases = api;
  },
}));
vi.mock("@/lib/settings", async () => {
  const { DEFAULT_EXTENDED_FIELD_MAPPING } = await import("@/lib/settings/types");
  return {
    getNotionConfig: async () => ({ apiToken: "token", databaseId: "database" }),
    getFieldMapping: async () => DEFAULT_EXTENDED_FIELD_MAPPING,
  };
});

const title = DEFAULT_EXTENDED_FIELD_MAPPING.title.notionPropertyName;
const date = DEFAULT_EXTENDED_FIELD_MAPPING.date.notionPropertyName;
const page = {
  object: "page",
  id: "page-1",
  archived: false,
  in_trash: false,
  properties: {
    [title]: { type: "title", title: [{ plain_text: "Team " }, { plain_text: "meeting" }] },
    [date]: {
      type: "date",
      date: { start: "2026-10-18T11:00:00+01:00", end: "2026-10-18T12:00:00+01:00" },
    },
  },
};

describe("Notion reconciliation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetNotionClient();
    api.retrieve.mockResolvedValue(page);
  });

  test("compares complete rich text and equivalent dates before writing", async () => {
    await updateNotionEvent("page-1", {
      title: "Team meeting",
      startTime: new Date("2026-10-18T10:00:00Z"),
      endTime: new Date("2026-10-18T11:00:00Z"),
    });
    expect(api.update).not.toHaveBeenCalled();
    expect((await getNotionEvent("page-1"))?.title).toBe("Team meeting");
  });

  test("writes real changes", async () => {
    await updateNotionEvent("page-1", { title: "Changed title" });
    expect(api.update).toHaveBeenCalledWith(expect.objectContaining({ page_id: "page-1" }));
  });

  test("reads all Notion pages, rather than treating the first 100 as the database", async () => {
    api.query
      .mockResolvedValueOnce({ results: [page], has_more: true, next_cursor: "cursor-2" })
      .mockResolvedValueOnce({
        results: [{ ...page, id: "page-2" }],
        has_more: false,
        next_cursor: null,
      });
    expect(await fetchNotionEvents()).toHaveLength(2);
    expect(api.query.mock.calls[1][0]).toEqual(
      expect.objectContaining({ start_cursor: "cursor-2" }),
    );
  });

  test("does not return an archived page as an active event", async () => {
    api.retrieve.mockResolvedValue({ ...page, archived: true });
    expect(await getNotionEvent("page-1")).toBeNull();
    expect(await isNotionPageArchived("page-1")).toBe(true);
  });

  test("a lost permission does not prove the page was deleted", async () => {
    api.retrieve.mockRejectedValue(
      Object.assign(new Error("Not found"), { code: "object_not_found" }),
    );
    await expect(isNotionPageArchived("page-1")).rejects.toThrow("Not found");
  });

  test("recovers created pages by their mapped Google event ID", async () => {
    api.query.mockResolvedValue({ results: [page] });
    expect((await findNotionEventByGcalId("gcal-1"))?.notionPageId).toBe("page-1");
    expect(api.query).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          property: DEFAULT_EXTENDED_FIELD_MAPPING.gcalEventId.notionPropertyName,
          rich_text: { equals: "gcal-1" },
        },
      }),
    );
  });
});

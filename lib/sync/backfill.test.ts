/**
 * Tests for backfill service
 */
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { BackfillProgress } from "./backfill";

// Mock Redis
vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}));

// Mock Google Calendar client
vi.mock("@/lib/google-calendar/client", () => ({
  fetchGcalEvents: vi.fn(),
}));

// Mock Notion client
vi.mock("@/lib/notion/client", () => ({
  updateNotionEvent: vi.fn(),
}));

// Mock settings
vi.mock("@/lib/settings", () => ({
  getExtendedFieldMapping: vi.fn(() => ({
    attendees: { enabled: true, notionPropertyName: "Attendees" },
    organizer: { enabled: true, notionPropertyName: "Organizer" },
    conferenceLink: { enabled: false, notionPropertyName: "Conference Link" },
    recurrence: { enabled: false, notionPropertyName: "Recurrence" },
    color: { enabled: false, notionPropertyName: "Color" },
    visibility: { enabled: false, notionPropertyName: "Visibility" },
  })),
}));

// Mock retry
vi.mock("@/lib/sync/retry", () => ({
  retryWithBackoff: vi.fn((fn) => fn()),
}));

describe("backfill service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("getBackfillProgress returns default when Redis is empty", async () => {
    const { getRedis } = await import("@/lib/redis");
    vi.mocked(getRedis).mockReturnValue({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
    } as unknown as ReturnType<typeof getRedis>);

    const { getBackfillProgress } = await import("./backfill");
    const progress = await getBackfillProgress();

    expect(progress).toEqual({
      status: "idle",
      total: 0,
      processed: 0,
      errors: 0,
      fields: [],
    });
  });

  test("getBackfillProgress returns stored progress", async () => {
    const storedProgress: BackfillProgress = {
      status: "running",
      total: 100,
      processed: 50,
      errors: 2,
      fields: ["attendees"],
      startedAt: "2025-01-26T10:00:00Z",
    };

    const { getRedis } = await import("@/lib/redis");
    vi.mocked(getRedis).mockReturnValue({
      get: vi.fn().mockResolvedValue(storedProgress),
      set: vi.fn(),
    } as unknown as ReturnType<typeof getRedis>);

    const { getBackfillProgress } = await import("./backfill");
    const progress = await getBackfillProgress();

    expect(progress).toEqual(storedProgress);
  });

  test("cancelBackfill sets status to cancelled", async () => {
    const mockSet = vi.fn();
    const { getRedis } = await import("@/lib/redis");
    vi.mocked(getRedis).mockReturnValue({
      get: vi.fn().mockResolvedValue({
        status: "running",
        total: 100,
        processed: 50,
        errors: 0,
        fields: ["attendees"],
      }),
      set: mockSet,
    } as unknown as ReturnType<typeof getRedis>);

    const { cancelBackfill } = await import("./backfill");
    await cancelBackfill();

    expect(mockSet).toHaveBeenCalledWith(
      "sync:backfill:progress",
      expect.objectContaining({ status: "cancelled" }),
    );
  });

  test("resetBackfill resets to default state", async () => {
    const mockSet = vi.fn();
    const { getRedis } = await import("@/lib/redis");
    vi.mocked(getRedis).mockReturnValue({
      get: vi.fn().mockResolvedValue({
        status: "completed",
        total: 100,
        processed: 100,
        errors: 0,
        fields: ["attendees"],
      }),
      set: mockSet,
    } as unknown as ReturnType<typeof getRedis>);

    const { resetBackfill } = await import("./backfill");
    await resetBackfill();

    expect(mockSet).toHaveBeenCalledWith(
      "sync:backfill:progress",
      expect.objectContaining({
        status: "idle",
        total: 0,
        processed: 0,
        errors: 0,
        fields: [],
      }),
    );
  });

  test("startBackfill throws if already running", async () => {
    const { getRedis } = await import("@/lib/redis");
    vi.mocked(getRedis).mockReturnValue({
      get: vi.fn().mockResolvedValue({
        status: "running",
        total: 100,
        processed: 50,
        errors: 0,
        fields: ["attendees"],
      }),
      set: vi.fn(),
    } as unknown as ReturnType<typeof getRedis>);

    const { startBackfill } = await import("./backfill");
    await expect(startBackfill(["attendees"])).rejects.toThrow("Backfill is already running");
  });

  test("startBackfill throws if no fields specified", async () => {
    const { getRedis } = await import("@/lib/redis");
    vi.mocked(getRedis).mockReturnValue({
      get: vi
        .fn()
        .mockResolvedValue({ status: "idle", total: 0, processed: 0, errors: 0, fields: [] }),
      set: vi.fn(),
    } as unknown as ReturnType<typeof getRedis>);

    const { startBackfill } = await import("./backfill");
    await expect(startBackfill([])).rejects.toThrow("No fields specified");
  });

  test("startBackfill processes linked events only", async () => {
    const mockSet = vi.fn();
    const { getRedis } = await import("@/lib/redis");
    vi.mocked(getRedis).mockReturnValue({
      get: vi
        .fn()
        .mockResolvedValue({ status: "idle", total: 0, processed: 0, errors: 0, fields: [] }),
      set: mockSet,
    } as unknown as ReturnType<typeof getRedis>);

    const { fetchGcalEvents } = await import("@/lib/google-calendar/client");
    vi.mocked(fetchGcalEvents).mockResolvedValue([
      {
        id: "1",
        title: "Event 1",
        notionPageId: "page1",
        startTime: new Date(),
        endTime: new Date(),
        attendees: ["John"],
      },
      {
        id: "2",
        title: "Event 2",
        notionPageId: undefined,
        startTime: new Date(),
        endTime: new Date(),
      }, // Not linked
      {
        id: "3",
        title: "Event 3",
        notionPageId: "page3",
        startTime: new Date(),
        endTime: new Date(),
        attendees: ["Jane"],
      },
    ]);

    const { updateNotionEvent } = await import("@/lib/notion/client");
    vi.mocked(updateNotionEvent).mockResolvedValue(undefined);

    const { startBackfill } = await import("./backfill");
    await startBackfill(["attendees"]);

    // Should only update linked events (2 out of 3)
    expect(updateNotionEvent).toHaveBeenCalledTimes(2);
  });
});

// Note: parseRRule tests are in lib/google-calendar/client.test.ts
// since they require the actual implementation (not mocked)

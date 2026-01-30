import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDaysSinceConnection,
  getTokenHealth,
  shouldPromptPublishedStatus,
} from "./token-health";

describe("getDaysSinceConnection", () => {
  beforeEach(() => {
    // Mock Date.now() to return a fixed timestamp
    // Using 2024-01-15T12:00:00Z as "now"
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for null input", () => {
    expect(getDaysSinceConnection(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getDaysSinceConnection("")).toBeNull();
  });

  it("returns null for invalid date string", () => {
    expect(getDaysSinceConnection("not-a-date")).toBeNull();
  });

  it("returns 0 for connection made today", () => {
    const today = "2024-01-15T08:00:00Z";
    expect(getDaysSinceConnection(today)).toBe(0);
  });

  it("returns 1 for connection made yesterday", () => {
    const yesterday = "2024-01-14T12:00:00Z";
    expect(getDaysSinceConnection(yesterday)).toBe(1);
  });

  it("returns 5 for connection made 5 days ago", () => {
    const fiveDaysAgo = "2024-01-10T12:00:00Z";
    expect(getDaysSinceConnection(fiveDaysAgo)).toBe(5);
  });

  it("returns 7 for connection made exactly 7 days ago", () => {
    const sevenDaysAgo = "2024-01-08T12:00:00Z";
    expect(getDaysSinceConnection(sevenDaysAgo)).toBe(7);
  });

  it("returns 10 for connection made 10 days ago", () => {
    const tenDaysAgo = "2024-01-05T12:00:00Z";
    expect(getDaysSinceConnection(tenDaysAgo)).toBe(10);
  });

  it("returns 30 for connection made a month ago", () => {
    const monthAgo = "2023-12-16T12:00:00Z";
    expect(getDaysSinceConnection(monthAgo)).toBe(30);
  });

  it("floors partial days (23 hours = 0 days)", () => {
    // 23 hours before "now"
    const almostYesterday = "2024-01-14T13:00:00Z";
    expect(getDaysSinceConnection(almostYesterday)).toBe(0);
  });

  it("floors partial days (25 hours = 1 day)", () => {
    // 25 hours before "now"
    const justOverADay = "2024-01-14T11:00:00Z";
    expect(getDaysSinceConnection(justOverADay)).toBe(1);
  });

  it("handles future dates (negative diff, but floors to negative)", () => {
    // A date in the future
    const futureDate = "2024-01-16T12:00:00Z";
    // This would be -1 day
    expect(getDaysSinceConnection(futureDate)).toBe(-1);
  });

  it("handles ISO date strings with timezone offset", () => {
    // UTC offset date string
    const withOffset = "2024-01-10T12:00:00+05:00";
    // This is actually 07:00 UTC, which is about 5 days and 5 hours ago
    expect(getDaysSinceConnection(withOffset)).toBe(5);
  });

  it("handles date-only strings", () => {
    const dateOnly = "2024-01-10";
    // Browser will interpret as midnight UTC/local
    const days = getDaysSinceConnection(dateOnly);
    expect(days).toBeGreaterThanOrEqual(4);
    expect(days).toBeLessThanOrEqual(6);
  });
});

describe("getTokenHealth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("returns null", () => {
    it("when connectedAt is null", () => {
      expect(getTokenHealth(null)).toBeNull();
    });

    it("when connectedAt is invalid", () => {
      expect(getTokenHealth("invalid-date")).toBeNull();
    });

    it("when connectedAt is empty string", () => {
      expect(getTokenHealth("")).toBeNull();
    });
  });

  describe("returns healthy status", () => {
    it("for 0 days old token", () => {
      const today = "2024-01-15T08:00:00Z";
      const health = getTokenHealth(today);

      expect(health).not.toBeNull();
      expect(health?.status).toBe("healthy");
      expect(health?.message).toBe("Token healthy (0 days old)");
      expect(health?.action).toBeUndefined();
    });

    it("for 1 day old token", () => {
      const yesterday = "2024-01-14T12:00:00Z";
      const health = getTokenHealth(yesterday);

      expect(health?.status).toBe("healthy");
      expect(health?.message).toBe("Token healthy (1 days old)");
      expect(health?.action).toBeUndefined();
    });

    it("for 4 days old token (boundary before warning)", () => {
      const fourDaysAgo = "2024-01-11T12:00:00Z";
      const health = getTokenHealth(fourDaysAgo);

      expect(health?.status).toBe("healthy");
      expect(health?.message).toBe("Token healthy (4 days old)");
      expect(health?.action).toBeUndefined();
    });
  });

  describe("returns warning status", () => {
    it("for 5 days old token (warning boundary)", () => {
      const fiveDaysAgo = "2024-01-10T12:00:00Z";
      const health = getTokenHealth(fiveDaysAgo);

      expect(health?.status).toBe("warning");
      expect(health?.message).toBe("Token expires in ~2 days");
      expect(health?.action).toBe("Consider reconnecting soon");
    });

    it("for 6 days old token", () => {
      const sixDaysAgo = "2024-01-09T12:00:00Z";
      const health = getTokenHealth(sixDaysAgo);

      expect(health?.status).toBe("warning");
      expect(health?.message).toBe("Token expires in ~1 days");
      expect(health?.action).toBe("Consider reconnecting soon");
    });
  });

  describe("returns critical status", () => {
    it("for 7 days old token (expiration boundary)", () => {
      const sevenDaysAgo = "2024-01-08T12:00:00Z";
      const health = getTokenHealth(sevenDaysAgo);

      expect(health?.status).toBe("critical");
      expect(health?.message).toBe("Token may have expired (7 days old)");
      expect(health?.action).toBe("Reconnect now to restore sync");
    });

    it("for 8 days old token", () => {
      const eightDaysAgo = "2024-01-07T12:00:00Z";
      const health = getTokenHealth(eightDaysAgo);

      expect(health?.status).toBe("critical");
      expect(health?.message).toBe("Token may have expired (8 days old)");
      expect(health?.action).toBe("Reconnect now to restore sync");
    });

    it("for 30 days old token", () => {
      const thirtyDaysAgo = "2023-12-16T12:00:00Z";
      const health = getTokenHealth(thirtyDaysAgo);

      expect(health?.status).toBe("critical");
      expect(health?.message).toBe("Token may have expired (30 days old)");
      expect(health?.action).toBe("Reconnect now to restore sync");
    });
  });

  describe("status transitions", () => {
    it("day 4 is healthy, day 5 is warning", () => {
      const day4 = "2024-01-11T12:00:00Z";
      const day5 = "2024-01-10T12:00:00Z";

      expect(getTokenHealth(day4)?.status).toBe("healthy");
      expect(getTokenHealth(day5)?.status).toBe("warning");
    });

    it("day 6 is warning, day 7 is critical", () => {
      const day6 = "2024-01-09T12:00:00Z";
      const day7 = "2024-01-08T12:00:00Z";

      expect(getTokenHealth(day6)?.status).toBe("warning");
      expect(getTokenHealth(day7)?.status).toBe("critical");
    });
  });

  describe("action messages", () => {
    it("healthy status has no action", () => {
      const health = getTokenHealth("2024-01-15T08:00:00Z");
      expect(health?.action).toBeUndefined();
    });

    it("warning status suggests reconnecting soon", () => {
      const health = getTokenHealth("2024-01-10T12:00:00Z");
      expect(health?.action).toBe("Consider reconnecting soon");
    });

    it("critical status urges immediate reconnection", () => {
      const health = getTokenHealth("2024-01-08T12:00:00Z");
      expect(health?.action).toBe("Reconnect now to restore sync");
    });
  });
});

describe("shouldPromptPublishedStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false for null input", () => {
    expect(shouldPromptPublishedStatus(null)).toBe(false);
  });

  it("returns false for 7 days old token", () => {
    const sevenDaysAgo = "2024-01-08T12:00:00Z";
    expect(shouldPromptPublishedStatus(sevenDaysAgo)).toBe(false);
  });

  it("returns true for 8 days old token", () => {
    const eightDaysAgo = "2024-01-07T12:00:00Z";
    expect(shouldPromptPublishedStatus(eightDaysAgo)).toBe(true);
  });

  it("returns true for 30 days old token", () => {
    const thirtyDaysAgo = "2023-12-16T12:00:00Z";
    expect(shouldPromptPublishedStatus(thirtyDaysAgo)).toBe(true);
  });

  it("returns false for fresh token", () => {
    const today = "2024-01-15T08:00:00Z";
    expect(shouldPromptPublishedStatus(today)).toBe(false);
  });
});

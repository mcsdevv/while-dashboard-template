import { describe, expect, test } from "vitest";
import { buildNotionPropertyValue, getPropertyValue } from "./client";

describe("notion property helpers", () => {
  test("buildNotionPropertyValue supports url and select", () => {
    expect(buildNotionPropertyValue("url", "https://example.com")).toEqual({
      url: "https://example.com",
    });

    expect(buildNotionPropertyValue("select", "Public")).toEqual({
      select: { name: "Public" },
    });
  });

  test("buildNotionPropertyValue supports date inputs", () => {
    const start = new Date("2025-01-01T00:00:00.000Z");
    const end = "2025-01-02T00:00:00Z";

    expect(buildNotionPropertyValue("date", { start, end })).toEqual({
      date: {
        start: "2025-01-01T00:00:00.000Z",
        end: "2025-01-02T00:00:00Z",
      },
    });
  });

  test("getPropertyValue reads url properties", () => {
    const properties = {
      Website: { type: "url", url: "https://example.com" },
      Visibility: { type: "select", select: { name: "Private" } },
    } as unknown as Parameters<typeof getPropertyValue>[0];

    expect(getPropertyValue(properties, "Website")).toBe("https://example.com");
    expect(getPropertyValue(properties, "Visibility")).toBe("Private");
  });
});

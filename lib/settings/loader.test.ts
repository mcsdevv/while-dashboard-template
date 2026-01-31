import { describe, expect, it, vi } from "vitest";
import { DEFAULT_EXTENDED_FIELD_MAPPING } from "./types";

vi.mock("./storage", () => ({
  getSettings: vi.fn(),
}));

describe("getExtendedFieldMapping", () => {
  it("returns the stored extended mapping when present", async () => {
    const { getSettings } = await import("./storage");
    vi.mocked(getSettings).mockResolvedValue({
      fieldMapping: DEFAULT_EXTENDED_FIELD_MAPPING,
    } as Awaited<ReturnType<typeof getSettings>>);

    const { getExtendedFieldMapping } = await import("./loader");
    const mapping = await getExtendedFieldMapping();

    expect(mapping).toEqual(DEFAULT_EXTENDED_FIELD_MAPPING);
  });
});

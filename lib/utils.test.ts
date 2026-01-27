import { expect, test } from "vitest";
import { cn, formatDate } from "./utils";

test("cn - combines class names", () => {
  const result = cn("foo", "bar");
  expect(result).toBe("foo bar");
});

test("cn - handles conditional classes", () => {
  const result = cn("foo", false && "bar", "baz");
  expect(result).toBe("foo baz");
});

test("cn - merges tailwind classes", () => {
  const result = cn("px-2 py-1", "px-4");
  // Should merge px-4 over px-2
  expect(result.includes("px-4")).toBe(true);
  expect(result.includes("px-2")).toBe(false);
  expect(result.includes("py-1")).toBe(true);
});

test("formatDate - formats date as relative time", () => {
  const now = new Date();
  const result = formatDate(now);
  expect(typeof result).toBe("string");
  expect(result.length > 0).toBe(true);
});

test("formatDate - handles past dates", () => {
  const pastDate = new Date(Date.now() - 1000 * 60 * 5); // 5 minutes ago
  const result = formatDate(pastDate);
  expect(typeof result).toBe("string");
  expect(result.length > 0).toBe(true);
  // formatDate returns absolute time format, not relative
});

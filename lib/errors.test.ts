import { expect, test } from "vitest";
import { isRetryableError, toAppError } from "./errors";

test.each([
  { status: 429 },
  { response: { status: 503 } },
  { code: 500 },
  { code: "rate_limited" },
])("retries structured API errors: %j", (metadata) => {
  const error = Object.assign(new Error("API request failed"), metadata);
  expect(isRetryableError(toAppError(error))).toBe(true);
});

test("does not retry a permanent API validation error", () => {
  expect(isRetryableError(Object.assign(new Error("Invalid property"), { status: 400 }))).toBe(
    false,
  );
});

test("retries Notion SDK request timeouts", () => {
  expect(isRetryableError(new Error("Request to Notion API has timed out"))).toBe(true);
});

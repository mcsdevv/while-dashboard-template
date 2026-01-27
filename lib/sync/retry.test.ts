import { NetworkError, RateLimitError, ValidationError, isRetryableError } from "@/lib/errors";
import { expect, test } from "vitest";
import { retryWithBackoff } from "./retry";

test("isRetryableError - identifies network errors", () => {
  const networkError = new NetworkError("Connection failed");
  expect(isRetryableError(networkError)).toBe(true);

  const genericNetworkError = new Error("ECONNREFUSED");
  expect(isRetryableError(genericNetworkError)).toBe(true);
});

test("isRetryableError - identifies rate limit errors", () => {
  const rateLimitError = new RateLimitError("Too many requests");
  expect(isRetryableError(rateLimitError)).toBe(true);

  const genericRateLimitError = new Error("Rate limit exceeded");
  expect(isRetryableError(genericRateLimitError)).toBe(true);
});

test("isRetryableError - identifies timeout errors", () => {
  const timeoutError = new Error("Connection timeout");
  expect(isRetryableError(timeoutError)).toBe(true);

  const etimedoutError = new Error("ETIMEDOUT");
  expect(isRetryableError(etimedoutError)).toBe(true);
});

test("isRetryableError - rejects non-retryable errors", () => {
  const validationError = new ValidationError("Invalid input");
  expect(isRetryableError(validationError)).toBe(false);

  const genericValidationError = new Error("Invalid input");
  expect(isRetryableError(genericValidationError)).toBe(false);
});

test("retryWithBackoff - succeeds on first try", async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    return "success";
  };

  const result = await retryWithBackoff(fn);
  expect(result).toBe("success");
  expect(attempts).toBe(1);
});

test("retryWithBackoff - retries on retryable error", async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error("ECONNREFUSED");
    }
    return "success";
  };

  const result = await retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10 });
  expect(result).toBe("success");
  expect(attempts).toBe(3);
});

test("retryWithBackoff - fails after max retries", async () => {
  const fn = async () => {
    throw new Error("ECONNREFUSED");
  };

  await expect(retryWithBackoff(fn, { maxRetries: 2, initialDelay: 10 })).rejects.toThrow(
    "ECONNREFUSED",
  );
});

test("retryWithBackoff - does not retry non-retryable errors", async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    throw new Error("Invalid input");
  };

  await expect(retryWithBackoff(fn)).rejects.toThrow("Invalid input");
  expect(attempts).toBe(1);
});

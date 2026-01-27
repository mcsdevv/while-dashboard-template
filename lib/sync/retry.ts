import { type AppError, isRetryableError, toAppError } from "@/lib/errors";
import { sleep } from "@/lib/utils";

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds before first retry (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds between retries (default: 10000) */
  maxDelay?: number;
  /** Callback invoked before each retry attempt */
  onRetry?: (error: AppError, attempt: number) => void;
}

/**
 * Retry a function with exponential backoff
 *
 * Automatically retries retryable errors with exponential backoff:
 * - Retry 1: initialDelay (default 1s)
 * - Retry 2: initialDelay * 2 (default 2s)
 * - Retry 3: initialDelay * 4 (default 4s)
 *
 * Non-retryable errors (validation, configuration) fail immediately.
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to function result
 * @throws Last error if all retries exhausted or error is non-retryable
 *
 * @example
 * ```ts
 * const result = await retryWithBackoff(
 *   () => fetchData(),
 *   {
 *     maxRetries: 3,
 *     initialDelay: 1000,
 *     onRetry: (error, attempt) => {
 *       console.log(`Retry ${attempt}: ${error.message}`);
 *     }
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000, onRetry } = options;

  let lastError: AppError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = toAppError(error);

      // Check if error is retryable before retrying
      const shouldRetry = attempt < maxRetries && isRetryableError(lastError);

      if (shouldRetry) {
        const delay = Math.min(initialDelay * 2 ** attempt, maxDelay);

        if (onRetry) {
          onRetry(lastError, attempt + 1);
        }

        console.log(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms:`,
          lastError.message,
        );

        await sleep(delay);
      } else if (!isRetryableError(lastError)) {
        // Non-retryable error, fail immediately
        throw lastError;
      }
    }
  }

  throw lastError!;
}

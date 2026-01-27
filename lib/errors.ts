/**
 * Custom error classes for While
 *
 * Provides structured error handling with:
 * - Error codes for programmatic handling
 * - Contextual information for debugging
 * - Retry-ability classification
 * - User-friendly messages
 */

/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isRetryable: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      code: string;
      statusCode?: number;
      isRetryable?: boolean;
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code;
    this.statusCode = options.statusCode ?? 500;
    this.isRetryable = options.isRetryable ?? false;
    this.context = options.context;

    if (options.cause) {
      this.cause = options.cause;
    }

    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON for logging and API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Notion API errors
 */
export class NotionError extends AppError {
  constructor(
    message: string,
    options?: {
      isRetryable?: boolean;
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, {
      code: "NOTION_ERROR",
      statusCode: 502,
      ...options,
    });
  }
}

/**
 * Google Calendar API errors
 */
export class GoogleCalendarError extends AppError {
  constructor(
    message: string,
    options?: {
      isRetryable?: boolean;
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, {
      code: "GCAL_ERROR",
      statusCode: 502,
      ...options,
    });
  }
}

/**
 * Validation errors for invalid input data
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      isRetryable: false,
      ...options,
    });
  }
}

/**
 * Configuration errors (missing/invalid env vars, etc.)
 */
export class ConfigurationError extends AppError {
  constructor(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, {
      code: "CONFIGURATION_ERROR",
      statusCode: 500,
      isRetryable: false,
      ...options,
    });
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(
    message: string,
    options?: {
      retryAfter?: number;
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, {
      code: "RATE_LIMIT_ERROR",
      statusCode: 429,
      isRetryable: true,
      context: {
        ...options?.context,
        retryAfter: options?.retryAfter,
      },
    });
    this.retryAfter = options?.retryAfter;
  }
}

/**
 * Network errors (timeouts, connection failures)
 */
export class NetworkError extends AppError {
  constructor(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, {
      code: "NETWORK_ERROR",
      statusCode: 503,
      isRetryable: true,
      ...options,
    });
  }
}

/**
 * Webhook errors
 */
export class WebhookError extends AppError {
  constructor(
    message: string,
    options?: {
      isRetryable?: boolean;
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, {
      code: "WEBHOOK_ERROR",
      statusCode: 500,
      ...options,
    });
  }
}

/**
 * Sync errors (loop detection, data conflicts, etc.)
 */
export class SyncError extends AppError {
  constructor(
    message: string,
    options?: {
      isRetryable?: boolean;
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, {
      code: "SYNC_ERROR",
      statusCode: 500,
      ...options,
    });
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isRetryable;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  // Rate limiting errors
  if (
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("quota exceeded")
  ) {
    return true;
  }

  // Network errors
  if (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("etimedout")
  ) {
    return true;
  }

  // Temporary server errors (5xx)
  if (message.includes("503") || message.includes("502") || message.includes("504")) {
    return true;
  }

  return false;
}

/**
 * Convert any error to an AppError for consistent error handling
 */
export function toAppError(
  error: unknown,
  defaultMessage = "An unexpected error occurred",
): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message || defaultMessage, {
      code: "UNKNOWN_ERROR",
      statusCode: 500,
      isRetryable: isRetryableError(error),
      cause: error,
    });
  }

  return new AppError(defaultMessage, {
    code: "UNKNOWN_ERROR",
    statusCode: 500,
    context: { originalError: error },
  });
}

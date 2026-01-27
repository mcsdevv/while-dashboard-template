/**
 * Structured logging system with log levels and context
 *
 * Provides enterprise-grade logging with:
 * - Log levels (debug, info, warn, error)
 * - Structured context data
 * - Performance timing
 * - Environment-aware output
 * - JSON formatting for production
 */

import { env } from "@/lib/env";
import type { AppError } from "@/lib/errors";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * Logger class for structured logging
 */
class Logger {
  private level: LogLevel;
  private context: LogContext;

  constructor(defaultContext: LogContext = {}) {
    this.context = defaultContext;
    this.level = this.parseLogLevel(env.LOG_LEVEL || "info");
  }

  /**
   * Parse log level from string
   */
  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case "debug":
        return LogLevel.DEBUG;
      case "info":
        return LogLevel.INFO;
      case "warn":
        return LogLevel.WARN;
      case "error":
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  /**
   * Format log entry for output
   */
  private formatLog(entry: LogEntry): string {
    if (env.NODE_ENV === "production") {
      // JSON format for production (parseable by log aggregators)
      return JSON.stringify(entry);
    }

    // Human-readable format for development
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const levelEmoji = this.getLevelEmoji(entry.level);
    let message = `${levelEmoji} [${timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      message += `\n   Context: ${JSON.stringify(entry.context, null, 2)}`;
    }

    if (entry.error) {
      message += `\n   Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        message += `\n   Stack: ${entry.error.stack}`;
      }
    }

    return message;
  }

  /**
   * Get emoji for log level
   */
  private getLevelEmoji(level: string): string {
    switch (level.toLowerCase()) {
      case "debug":
        return "🔍";
      case "info":
        return "ℹ️";
      case "warn":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "📝";
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context });
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "debug",
      message,
      context: { ...this.context, ...context },
    };

    console.debug(this.formatLog(entry));
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      context: { ...this.context, ...context },
    };

    console.info(this.formatLog(entry));
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      context: { ...this.context, ...context },
    };

    console.warn(this.formatLog(entry));
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | AppError, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      context: { ...this.context, ...context },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: "code" in error ? String(error.code) : undefined,
      };
    }

    console.error(this.formatLog(entry));
  }

  /**
   * Time a function and log the duration
   */
  async time<T>(label: string, fn: () => Promise<T>, context?: LogContext): Promise<T> {
    const start = Date.now();
    this.debug(`${label} - started`, context);

    try {
      const result = await fn();
      const duration = Date.now() - start;

      this.info(`${label} - completed`, {
        ...context,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      this.error(`${label} - failed`, error instanceof Error ? error : new Error(String(error)), {
        ...context,
        duration: `${duration}ms`,
      });

      throw error;
    }
  }
}

/**
 * Create a logger instance
 */
export function createLogger(context?: LogContext): Logger {
  return new Logger(context);
}

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Create logger for a specific module
 */
export function createModuleLogger(module: string): Logger {
  return createLogger({ module });
}

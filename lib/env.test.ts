import { expect, test } from "vitest";
import { z } from "zod";

// Test the schema validation logic without importing env
const envSchema = z.object({
  NOTION_API_TOKEN: z.string().min(1, "Notion API token is required"),
  NOTION_DATABASE_ID: z.string().min(1, "Notion database ID is required"),
  GOOGLE_CALENDAR_CLIENT_ID: z.string().min(1, "Google Calendar client ID is required"),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string().min(1, "Google Calendar client secret is required"),
  GOOGLE_CALENDAR_REFRESH_TOKEN: z.string().min(1, "Google Calendar refresh token is required"),
  GOOGLE_CALENDAR_CALENDAR_ID: z.string().default("primary"),
  WEBHOOK_URL: z.string().url().optional(),
  ADMIN_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

test("envSchema - validates required fields", () => {
  const validEnv = {
    NOTION_API_TOKEN: "secret_123",
    NOTION_DATABASE_ID: "db_123",
    GOOGLE_CALENDAR_CLIENT_ID: "client_123",
    GOOGLE_CALENDAR_CLIENT_SECRET: "secret_123",
    GOOGLE_CALENDAR_REFRESH_TOKEN: "refresh_123",
  };

  const result = envSchema.safeParse(validEnv);
  expect(result.success).toBe(true);
});

test("envSchema - rejects missing required fields", () => {
  const invalidEnv = {
    NOTION_API_TOKEN: "secret_123",
    // Missing other required fields
  };

  const result = envSchema.safeParse(invalidEnv);
  expect(result.success).toBe(false);
});

test("envSchema - applies defaults", () => {
  const validEnv = {
    NOTION_API_TOKEN: "secret_123",
    NOTION_DATABASE_ID: "db_123",
    GOOGLE_CALENDAR_CLIENT_ID: "client_123",
    GOOGLE_CALENDAR_CLIENT_SECRET: "secret_123",
    GOOGLE_CALENDAR_REFRESH_TOKEN: "refresh_123",
  };

  const result = envSchema.safeParse(validEnv);
  if (result.success) {
    expect(result.data.NODE_ENV).toBe("development");
    expect(result.data.LOG_LEVEL).toBe("info");
    expect(result.data.GOOGLE_CALENDAR_CALENDAR_ID).toBe("primary");
  }
});

test("envSchema - validates webhook URL format", () => {
  const invalidEnv = {
    NOTION_API_TOKEN: "secret_123",
    NOTION_DATABASE_ID: "db_123",
    GOOGLE_CALENDAR_CLIENT_ID: "client_123",
    GOOGLE_CALENDAR_CLIENT_SECRET: "secret_123",
    GOOGLE_CALENDAR_REFRESH_TOKEN: "refresh_123",
    WEBHOOK_URL: "not-a-url",
  };

  const result = envSchema.safeParse(invalidEnv);
  expect(result.success).toBe(false);
});

test("envSchema - accepts valid webhook URL", () => {
  const validEnv = {
    NOTION_API_TOKEN: "secret_123",
    NOTION_DATABASE_ID: "db_123",
    GOOGLE_CALENDAR_CLIENT_ID: "client_123",
    GOOGLE_CALENDAR_CLIENT_SECRET: "secret_123",
    GOOGLE_CALENDAR_REFRESH_TOKEN: "refresh_123",
    WEBHOOK_URL: "https://example.com/webhook",
  };

  const result = envSchema.safeParse(validEnv);
  expect(result.success).toBe(true);
});

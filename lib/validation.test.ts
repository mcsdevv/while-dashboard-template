/**
 * Validation tests
 *
 * Tests for Zod schemas and validation helper functions
 */

import { expect, test } from "vitest";
import {
  authHeaderSchema,
  eventDataSchema,
  eventStatusSchema,
  gcalWebhookHeadersSchema,
  notionWebhookEventSchema,
  notionWebhookPayloadSchema,
  notionWebhookVerificationSchema,
  reminderSchema,
  sanitizeString,
  syncDirectionSchema,
  syncOperationSchema,
  validate,
  validateDateRange,
  validateEvent,
  validateSafe,
  webhookChannelSchema,
  webhookSetupRequestSchema,
} from "./validation";

// Google Calendar webhook headers validation
test("gcalWebhookHeadersSchema - validates valid headers", () => {
  const validHeaders = {
    "x-goog-resource-state": "exists",
    "x-goog-resource-id": "resource-123",
    "x-goog-channel-id": "channel-456",
    "x-goog-message-number": "1",
  };

  const result = gcalWebhookHeadersSchema.safeParse(validHeaders);
  expect(result.success).toBe(true);
});

test("gcalWebhookHeadersSchema - rejects invalid resource state", () => {
  const invalidHeaders = {
    "x-goog-resource-state": "invalid",
  };

  const result = gcalWebhookHeadersSchema.safeParse(invalidHeaders);
  expect(result.success).toBe(false);
});

// Notion webhook validation
test("notionWebhookVerificationSchema - validates verification payload", () => {
  // Notion only sends verification_token, no type field
  const verification = {
    verification_token: "token-123",
  };

  const result = notionWebhookVerificationSchema.safeParse(verification);
  expect(result.success).toBe(true);
});

test("notionWebhookEventSchema - validates page.created event", () => {
  const event = {
    type: "page.created",
    entity: {
      id: "123e4567-e89b-12d3-a456-426614174000",
    },
  };

  const result = notionWebhookEventSchema.safeParse(event);
  expect(result.success).toBe(true);
});

test("notionWebhookEventSchema - rejects invalid UUID", () => {
  const event = {
    type: "page.created",
    entity: {
      id: "not-a-uuid",
    },
  };

  const result = notionWebhookEventSchema.safeParse(event);
  expect(result.success).toBe(false);
});

test("notionWebhookPayloadSchema - accepts verification or event", () => {
  // Notion only sends verification_token, no type field
  const verification = {
    verification_token: "token-123",
  };

  const event = {
    type: "page.deleted",
    entity: {
      id: "123e4567-e89b-12d3-a456-426614174000",
    },
  };

  expect(notionWebhookPayloadSchema.safeParse(verification).success).toBe(true);
  expect(notionWebhookPayloadSchema.safeParse(event).success).toBe(true);
});

// Webhook setup validation
test("webhookSetupRequestSchema - validates optional URL", () => {
  const withUrl = { webhookUrl: "https://example.com/webhook" };
  const withoutUrl = {};

  expect(webhookSetupRequestSchema.safeParse(withUrl).success).toBe(true);
  expect(webhookSetupRequestSchema.safeParse(withoutUrl).success).toBe(true);
});

test("webhookSetupRequestSchema - rejects invalid URL", () => {
  const invalid = { webhookUrl: "not-a-url" };
  const result = webhookSetupRequestSchema.safeParse(invalid);
  expect(result.success).toBe(false);
});

// Authorization validation
test("authHeaderSchema - validates Bearer token", () => {
  const valid = "Bearer secret-token-123";
  const result = authHeaderSchema.safeParse(valid);
  expect(result.success).toBe(true);
});

test("authHeaderSchema - rejects invalid format", () => {
  const invalid = "Token secret-token-123";
  const result = authHeaderSchema.safeParse(invalid);
  expect(result.success).toBe(false);
});

// Event data validation
test("eventStatusSchema - validates event statuses", () => {
  expect(eventStatusSchema.safeParse("confirmed").success).toBe(true);
  expect(eventStatusSchema.safeParse("tentative").success).toBe(true);
  expect(eventStatusSchema.safeParse("cancelled").success).toBe(true);
  expect(eventStatusSchema.safeParse("invalid").success).toBe(false);
});

test("reminderSchema - validates reminder data", () => {
  const validReminder = {
    method: "email",
    minutes: 30,
  };

  const result = reminderSchema.safeParse(validReminder);
  expect(result.success).toBe(true);
});

test("reminderSchema - rejects out-of-range minutes", () => {
  const invalidReminder = {
    method: "popup",
    minutes: 50000, // Exceeds max 40320 (4 weeks)
  };

  const result = reminderSchema.safeParse(invalidReminder);
  expect(result.success).toBe(false);
});

test("eventDataSchema - validates complete event", () => {
  const event = {
    id: "event-123",
    title: "Team Meeting",
    description: "Quarterly planning session",
    startTime: new Date("2026-02-01T10:00:00Z"),
    endTime: new Date("2026-02-01T11:00:00Z"),
    location: "Conference Room A",
    status: "confirmed",
    reminders: [{ method: "email", minutes: 30 }],
    gcalEventId: "gcal-123",
    notionPageId: "123e4567-e89b-12d3-a456-426614174000",
  };

  const result = eventDataSchema.safeParse(event);
  expect(result.success).toBe(true);
});

test("eventDataSchema - requires title", () => {
  const event = {
    id: "event-123",
    title: "",
    startTime: new Date(),
    endTime: new Date(),
  };

  const result = eventDataSchema.safeParse(event);
  expect(result.success).toBe(false);
});

test("eventDataSchema - limits title length", () => {
  const event = {
    id: "event-123",
    title: "A".repeat(501), // Exceeds max 500
    startTime: new Date(),
    endTime: new Date(),
  };

  const result = eventDataSchema.safeParse(event);
  expect(result.success).toBe(false);
});

// Sync validation
test("syncDirectionSchema - validates sync directions", () => {
  expect(syncDirectionSchema.safeParse("notion_to_gcal").success).toBe(true);
  expect(syncDirectionSchema.safeParse("gcal_to_notion").success).toBe(true);
  expect(syncDirectionSchema.safeParse("bidirectional").success).toBe(true);
  expect(syncDirectionSchema.safeParse("invalid").success).toBe(false);
});

test("syncOperationSchema - validates operations", () => {
  expect(syncOperationSchema.safeParse("create").success).toBe(true);
  expect(syncOperationSchema.safeParse("update").success).toBe(true);
  expect(syncOperationSchema.safeParse("delete").success).toBe(true);
  expect(syncOperationSchema.safeParse("invalid").success).toBe(false);
});

// Webhook channel validation
test("webhookChannelSchema - validates channel metadata", () => {
  const channel = {
    channelId: "channel-123",
    resourceId: "resource-456",
    expiration: Date.now() + 86400000, // 24 hours from now
    calendarId: "calendar-789",
    createdAt: new Date(),
    lastRenewedAt: new Date(),
  };

  const result = webhookChannelSchema.safeParse(channel);
  expect(result.success).toBe(true);
});

test("webhookChannelSchema - rejects negative expiration", () => {
  const channel = {
    channelId: "channel-123",
    resourceId: "resource-456",
    expiration: -1000,
    calendarId: "calendar-789",
    createdAt: new Date(),
    lastRenewedAt: new Date(),
  };

  const result = webhookChannelSchema.safeParse(channel);
  expect(result.success).toBe(false);
});

// Helper function tests
test("validate - returns parsed data on success", () => {
  const data = { method: "email", minutes: 15 };
  const result = validate(reminderSchema, data);

  expect(result.method).toBe("email");
  expect(result.minutes).toBe(15);
});

test("validate - throws on validation error", () => {
  const data = { method: "invalid", minutes: 15 };

  expect(() => validate(reminderSchema, data)).toThrow("Validation failed");
});

test("validateSafe - returns success result", () => {
  const data = { method: "popup", minutes: 60 };
  const result = validateSafe(reminderSchema, data);

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.method).toBe("popup");
  }
});

test("validateSafe - returns error result", () => {
  const data = { method: "invalid", minutes: 60 };
  const result = validateSafe(reminderSchema, data);

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error).toContain("Invalid enum value");
  }
});

test("validateDateRange - validates end after start", () => {
  const start = new Date("2026-01-01T10:00:00Z");
  const end = new Date("2026-01-01T11:00:00Z");

  expect(validateDateRange(start, end)).toBe(true);
});

test("validateDateRange - rejects end before start", () => {
  const start = new Date("2026-01-01T11:00:00Z");
  const end = new Date("2026-01-01T10:00:00Z");

  expect(validateDateRange(start, end)).toBe(false);
});

test("validateEvent - accepts valid event", () => {
  const event = {
    id: "event-123",
    title: "Meeting",
    startTime: new Date("2026-01-01T10:00:00Z"),
    endTime: new Date("2026-01-01T11:00:00Z"),
  };

  const result = validateEvent(event);
  expect(result.valid).toBe(true);
  expect(result.errors.length).toBe(0);
});

test("validateEvent - rejects end before start", () => {
  const event = {
    id: "event-123",
    title: "Meeting",
    startTime: new Date("2026-01-01T11:00:00Z"),
    endTime: new Date("2026-01-01T10:00:00Z"),
  };

  const result = validateEvent(event);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.includes("End time must be after start time"))).toBe(true);
});

test("validateEvent - rejects events longer than 30 days", () => {
  const event = {
    id: "event-123",
    title: "Long Event",
    startTime: new Date("2026-01-01T00:00:00Z"),
    endTime: new Date("2026-02-15T00:00:00Z"), // 45 days
  };

  const result = validateEvent(event);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.includes("cannot exceed 30 days"))).toBe(true);
});

test("sanitizeString - trims and limits length", () => {
  const input = "  hello world  ";
  const result = sanitizeString(input, 5);

  expect(result).toBe("hello");
});

test("sanitizeString - handles unicode correctly", () => {
  const input = "Hello 👋 World";
  const result = sanitizeString(input, 8);

  expect(result.length <= 8).toBe(true);
});

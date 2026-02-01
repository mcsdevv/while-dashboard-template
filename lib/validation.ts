/**
 * Input validation schemas using Zod
 *
 * Provides runtime validation for:
 * - Webhook payloads and headers
 * - API request bodies
 * - Event data structures
 * - Admin requests
 */

import { z } from "zod";

/**
 * Google Calendar webhook headers schema
 */
export const gcalWebhookHeadersSchema = z.object({
  "x-goog-resource-state": z.enum(["sync", "exists", "not_exists"]).optional(),
  "x-goog-resource-id": z.string().optional(),
  "x-goog-channel-id": z.string().optional(),
  "x-goog-message-number": z.string().optional(),
});

export type GcalWebhookHeaders = z.infer<typeof gcalWebhookHeadersSchema>;

/**
 * Notion webhook verification payload schema
 * Note: Notion only sends verification_token, no type field
 */
export const notionWebhookVerificationSchema = z.object({
  verification_token: z.string(),
});

/**
 * Notion webhook event entity schema
 */
export const notionWebhookEntitySchema = z.object({
  id: z.string().uuid(),
});

/**
 * Notion webhook event payload schema
 */
export const notionWebhookEventSchema = z.object({
  type: z.enum(["page.created", "page.content_updated", "page.properties_updated", "page.deleted"]),
  entity: notionWebhookEntitySchema,
});

/**
 * Union of all Notion webhook payload types
 */
export const notionWebhookPayloadSchema = z.union([
  notionWebhookVerificationSchema,
  notionWebhookEventSchema,
]);

export type NotionWebhookPayload = z.infer<typeof notionWebhookPayloadSchema>;

/**
 * Webhook setup request body schema
 */
export const webhookSetupRequestSchema = z.object({
  webhookUrl: z.string().url().optional(),
});

export type WebhookSetupRequest = z.infer<typeof webhookSetupRequestSchema>;

/**
 * Authorization header schema
 */
export const authHeaderSchema = z.string().regex(/^Bearer .+$/);

/**
 * Event data validation schemas
 */

export const eventStatusSchema = z.enum(["confirmed", "tentative", "cancelled"]).optional();

export const reminderSchema = z.object({
  method: z.enum(["email", "popup"]),
  minutes: z.number().int().min(0).max(40320), // Max 4 weeks in minutes
});

export const eventDataSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  startTime: z.date(),
  endTime: z.date(),
  location: z.string().max(500).optional(),
  status: eventStatusSchema,
  reminders: z.array(reminderSchema).optional(),
  gcalEventId: z.string().optional(),
  notionPageId: z.string().uuid().optional(),
});

export type EventData = z.infer<typeof eventDataSchema>;

/**
 * Partial event update schema (all fields optional except required IDs)
 */
export const eventUpdateSchema = eventDataSchema.partial().required({ id: true });

export type EventUpdate = z.infer<typeof eventUpdateSchema>;

/**
 * Sync direction validation
 */
export const syncDirectionSchema = z.enum(["notion_to_gcal", "gcal_to_notion", "bidirectional"]);

export type SyncDirection = z.infer<typeof syncDirectionSchema>;

/**
 * Sync operation validation
 */
export const syncOperationSchema = z.enum(["create", "update", "delete"]);

export type SyncOperation = z.infer<typeof syncOperationSchema>;

/**
 * Webhook channel metadata schema
 */
export const webhookChannelSchema = z.object({
  channelId: z.string(),
  resourceId: z.string(),
  expiration: z.number().int().positive(),
  calendarId: z.string(),
  createdAt: z.date(),
  lastRenewedAt: z.date(),
});

export type WebhookChannel = z.infer<typeof webhookChannelSchema>;

/**
 * Notion webhook subscription schema
 */
export const notionWebhookSchema = z.object({
  subscriptionId: z.string(),
  databaseId: z.string().uuid(),
  verificationToken: z.string(),
  createdAt: z.date(),
  verified: z.boolean(),
});

export type NotionWebhook = z.infer<typeof notionWebhookSchema>;

/**
 * Sync state schema
 */
export const syncStateSchema = z.object({
  syncToken: z.string().optional(),
  lastSync: z.date().nullable(),
});

export type SyncState = z.infer<typeof syncStateSchema>;

/**
 * Validation helper functions
 */

/**
 * Validate and parse data with Zod schema
 * Returns parsed data on success, throws detailed error on failure
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      throw new Error(`Validation failed: ${errors}`);
    }
    throw error;
  }
}

/**
 * Safe validation that returns result object instead of throwing
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
  return { success: false, error: errors };
}

/**
 * Extract and validate headers from NextRequest
 */
export function extractHeaders(request: Request, keys: string[]): Record<string, string | null> {
  const headers: Record<string, string | null> = {};

  for (const key of keys) {
    headers[key] = request.headers.get(key);
  }

  return headers;
}

/**
 * Validate date range (end must be after start)
 */
export function validateDateRange(startTime: Date, endTime: Date): boolean {
  return endTime > startTime;
}

/**
 * Validate event data with custom business rules
 */
export function validateEvent(event: EventData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check date range
  if (!validateDateRange(event.startTime, event.endTime)) {
    errors.push("End time must be after start time");
  }

  // Check event duration (max 30 days)
  const durationMs = event.endTime.getTime() - event.startTime.getTime();
  const maxDurationMs = 30 * 24 * 60 * 60 * 1000;
  if (durationMs > maxDurationMs) {
    errors.push("Event duration cannot exceed 30 days");
  }

  // Validate reminders
  if (event.reminders) {
    for (const reminder of event.reminders) {
      if (reminder.minutes < 0) {
        errors.push("Reminder minutes must be non-negative");
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string input (trim and limit length)
 */
export function sanitizeString(input: string, maxLength: number): string {
  return input.trim().slice(0, maxLength);
}

/**
 * Parse and validate JSON from request body
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const text = await request.text();
    const json = JSON.parse(text);
    return validateSafe(schema, json);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, error: "Invalid JSON" };
    }
    return { success: false, error: "Failed to parse request body" };
  }
}

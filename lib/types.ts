import { z } from "zod";

// Shared event schema
export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.date(),
  endTime: z.date(),
  location: z.string().optional(),
  status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
  reminders: z.number().optional(), // minutes before event
  // Extended event properties
  attendees: z.array(z.string()).optional(), // Array of attendee names/emails
  organizer: z.string().optional(), // Event organizer name/email
  conferenceLink: z.string().optional(), // Video call URLs (Zoom/Meet)
  recurrence: z.string().optional(), // Human-readable recurrence like "Every Monday"
  color: z.string().optional(), // Google Calendar color name like "Tomato", "Banana"
  visibility: z.enum(["public", "private", "default"]).optional(), // Event visibility
  // Sync metadata
  notionPageId: z.string().optional(),
  gcalEventId: z.string().optional(),
});

export type Event = z.infer<typeof eventSchema>;

// Sync operation types
export type SyncOperation = "create" | "update" | "delete";

export type SyncDirection = "notion_to_gcal" | "gcal_to_notion";

export interface SyncLog {
  id: string;
  timestamp: Date | string; // Date object or ISO string from Redis
  direction: SyncDirection;
  operation: SyncOperation;
  eventId: string;
  eventTitle: string;
  status: "success" | "failure";
  error?: string;
  // Extended fields for debugging
  notionPageId?: string;
  gcalEventId?: string;
  processingTime?: number; // Operation duration in ms
  rawPayload?: unknown; // Original event data for debugging
}

export interface SyncMetrics {
  lastSyncNotionToGcal: Date | string | null; // Date object or ISO string from Redis
  lastSyncGcalToNotion: Date | string | null; // Date object or ISO string from Redis
  totalSuccess: number;
  totalFailures: number;
  recentLogs: SyncLog[];
  operationCounts: {
    creates: number;
    updates: number;
    deletes: number;
  };
  apiQuota: {
    notion: {
      used: number;
    };
    googleCalendar: {
      used: number;
    };
  };
}

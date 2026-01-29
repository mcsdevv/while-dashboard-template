/**
 * Settings types for the Notion-GCal sync application.
 * These settings are stored encrypted in Redis and allow users
 * to configure the app via web UI instead of environment variables.
 */

export interface GoogleSettings {
  // Note: clientId and clientSecret now come from GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET env vars
  refreshToken: string; // Encrypted at rest, obtained during OAuth sign-in
  calendarId: string;
  calendarName?: string; // Display name of the selected calendar
  connectedAt: string; // ISO timestamp
  oauthAppPublished?: boolean; // User-confirmed: OAuth app is published (no 7-day token expiry)
}

export interface NotionSettings {
  apiToken: string; // Encrypted at rest
  databaseId: string;
  databaseName?: string;
}

export interface FieldMapping {
  title: string;
  date: string;
  description: string;
  location: string;
  gcalEventId: string;
  reminders: string;
}

export type NotionPropertyType =
  | "title"
  | "rich_text"
  | "number"
  | "date"
  | "checkbox"
  | "url"
  | "select";

export interface FieldConfig {
  enabled: boolean;
  notionPropertyName: string;
  displayLabel: string;
  propertyType: NotionPropertyType;
  required: boolean; // true for title/date only
}

export interface ExtendedFieldMapping {
  // Required (always enabled)
  title: FieldConfig;
  date: FieldConfig;
  // Existing optional
  description: FieldConfig;
  location: FieldConfig;
  gcalEventId: FieldConfig;
  reminders: FieldConfig;
  // New fields
  attendees: FieldConfig; // comma-separated: "John Doe, Jane Smith"
  organizer: FieldConfig; // text
  conferenceLink: FieldConfig; // Zoom/Meet URLs
  recurrence: FieldConfig; // human-readable: "Every Monday"
  color: FieldConfig; // text name: "Blue", "Tomato"
  visibility: FieldConfig; // "public" | "private"
}

export const GCAL_COLORS: Record<string, { name: string; hex: string }> = {
  "1": { name: "Lavender", hex: "#7986cb" },
  "2": { name: "Sage", hex: "#33b679" },
  "3": { name: "Grape", hex: "#8e24aa" },
  "4": { name: "Flamingo", hex: "#e67c73" },
  "5": { name: "Banana", hex: "#f6bf26" },
  "6": { name: "Tangerine", hex: "#f4511e" },
  "7": { name: "Peacock", hex: "#039be5" },
  "8": { name: "Graphite", hex: "#616161" },
  "9": { name: "Blueberry", hex: "#3f51b5" },
  "10": { name: "Basil", hex: "#0b8043" },
  "11": { name: "Tomato", hex: "#d50000" },
};

export const DEFAULT_EXTENDED_FIELD_MAPPING: ExtendedFieldMapping = {
  title: {
    enabled: true,
    notionPropertyName: "Title",
    displayLabel: "Event Title",
    propertyType: "title",
    required: true,
  },
  date: {
    enabled: true,
    notionPropertyName: "Date",
    displayLabel: "Event Date",
    propertyType: "date",
    required: true,
  },
  description: {
    enabled: true,
    notionPropertyName: "Description",
    displayLabel: "Description",
    propertyType: "rich_text",
    required: false,
  },
  location: {
    enabled: true,
    notionPropertyName: "Location",
    displayLabel: "Location",
    propertyType: "rich_text",
    required: false,
  },
  gcalEventId: {
    enabled: true,
    notionPropertyName: "GCal Event ID",
    displayLabel: "GCal Event ID",
    propertyType: "rich_text",
    required: false,
  },
  reminders: {
    enabled: false,
    notionPropertyName: "Reminders",
    displayLabel: "Reminder Minutes",
    propertyType: "number",
    required: false,
  },
  attendees: {
    enabled: false,
    notionPropertyName: "Attendees",
    displayLabel: "Attendees",
    propertyType: "rich_text",
    required: false,
  },
  organizer: {
    enabled: false,
    notionPropertyName: "Organizer",
    displayLabel: "Organizer",
    propertyType: "rich_text",
    required: false,
  },
  conferenceLink: {
    enabled: false,
    notionPropertyName: "Conference Link",
    displayLabel: "Conference Link",
    propertyType: "url",
    required: false,
  },
  recurrence: {
    enabled: false,
    notionPropertyName: "Recurrence",
    displayLabel: "Recurrence",
    propertyType: "rich_text",
    required: false,
  },
  color: {
    enabled: false,
    notionPropertyName: "Color",
    displayLabel: "Calendar Color",
    propertyType: "select",
    required: false,
  },
  visibility: {
    enabled: false,
    notionPropertyName: "Visibility",
    displayLabel: "Visibility",
    propertyType: "select",
    required: false,
  },
};

export interface AppSettings {
  google: GoogleSettings;
  notion: NotionSettings;
  fieldMapping: FieldMapping | ExtendedFieldMapping; // Accept both during migration
  setupCompleted: boolean;
}

/**
 * Default field mapping that matches the expected Notion database schema.
 * These are the property names used in the Notion database.
 */
export const DEFAULT_FIELD_MAPPING: FieldMapping = {
  title: "Title",
  date: "Date",
  description: "Description",
  location: "Location",
  gcalEventId: "GCal Event ID",
  reminders: "Reminders",
};

/**
 * Fields that contain sensitive data and must be encrypted at rest.
 */
export const ENCRYPTED_FIELDS = {
  google: ["refreshToken"] as const,
  notion: ["apiToken"] as const,
};

export type EncryptedGoogleFields = (typeof ENCRYPTED_FIELDS.google)[number];
export type EncryptedNotionFields = (typeof ENCRYPTED_FIELDS.notion)[number];

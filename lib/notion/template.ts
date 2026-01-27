/**
 * Notion Database Template Schema
 *
 * This file defines the expected schema for the Denver Calendar Sync template.
 * When users duplicate our template, they get a database with the correct
 * properties pre-configured, eliminating field mapping errors.
 */

/**
 * Public template URL - users duplicate this to create their database
 * TODO: Replace with actual public template URL once created
 */
export const TEMPLATE_URL = "https://www.notion.so/templates/denver-calendar-sync";

/**
 * Expected property names in the template database
 */
export const TEMPLATE_PROPERTIES = {
  // Required fields
  title: "Title",
  date: "Date",

  // Optional fields (enabled by default in template)
  description: "Description",
  location: "Location",
  gcalEventId: "GCal Event ID",
  status: "Status",

  // Extended fields (disabled by default, but present in template)
  reminders: "Reminders",
  attendees: "Attendees",
  organizer: "Organizer",
  conferenceLink: "Conference Link",
  recurrence: "Recurrence",
  color: "Color",
  visibility: "Visibility",
} as const;

/**
 * Expected property types for each field
 */
export const TEMPLATE_PROPERTY_TYPES: Record<string, string> = {
  [TEMPLATE_PROPERTIES.title]: "title",
  [TEMPLATE_PROPERTIES.date]: "date",
  [TEMPLATE_PROPERTIES.description]: "rich_text",
  [TEMPLATE_PROPERTIES.location]: "rich_text",
  [TEMPLATE_PROPERTIES.gcalEventId]: "rich_text",
  [TEMPLATE_PROPERTIES.status]: "select",
  [TEMPLATE_PROPERTIES.reminders]: "number",
  [TEMPLATE_PROPERTIES.attendees]: "rich_text",
  [TEMPLATE_PROPERTIES.organizer]: "rich_text",
  [TEMPLATE_PROPERTIES.conferenceLink]: "rich_text",
  [TEMPLATE_PROPERTIES.recurrence]: "rich_text",
  [TEMPLATE_PROPERTIES.color]: "rich_text",
  [TEMPLATE_PROPERTIES.visibility]: "rich_text",
};

/**
 * Status select options in the template
 */
export const TEMPLATE_STATUS_OPTIONS = ["Confirmed", "Tentative", "Cancelled"];

interface DatabaseProperty {
  name: string;
  type: string;
}

/**
 * Check if a database matches the template schema
 * Returns a score (0-100) indicating how well it matches
 */
export function matchesTemplateSchema(properties: DatabaseProperty[]): {
  score: number;
  matchedFields: string[];
  missingFields: string[];
} {
  const propertyMap = new Map(properties.map((p) => [p.name.toLowerCase(), p.type]));

  const requiredFields: string[] = [TEMPLATE_PROPERTIES.title, TEMPLATE_PROPERTIES.date];
  const optionalFields: string[] = [
    TEMPLATE_PROPERTIES.description,
    TEMPLATE_PROPERTIES.location,
    TEMPLATE_PROPERTIES.gcalEventId,
    TEMPLATE_PROPERTIES.status,
  ];

  const matchedFields: string[] = [];
  const missingFields: string[] = [];

  // Check required fields
  for (const field of requiredFields) {
    const expectedType = TEMPLATE_PROPERTY_TYPES[field];
    const actualType = propertyMap.get(field.toLowerCase());

    if (actualType === expectedType) {
      matchedFields.push(field);
    } else {
      missingFields.push(field);
    }
  }

  // Check optional fields
  for (const field of optionalFields) {
    const expectedType = TEMPLATE_PROPERTY_TYPES[field];
    const actualType = propertyMap.get(field.toLowerCase());

    if (actualType === expectedType) {
      matchedFields.push(field);
    }
    // Don't add to missingFields for optional fields
  }

  // Calculate score: required fields are worth more
  const requiredMatches = matchedFields.filter((f) => requiredFields.includes(f)).length;
  const optionalMatches = matchedFields.filter((f) => optionalFields.includes(f)).length;

  const requiredScore = (requiredMatches / requiredFields.length) * 70; // 70% weight
  const optionalScore = (optionalMatches / optionalFields.length) * 30; // 30% weight

  return {
    score: Math.round(requiredScore + optionalScore),
    matchedFields,
    missingFields,
  };
}

/**
 * Generate default field mapping for a template database
 */
export function generateTemplateFieldMapping() {
  return {
    title: {
      enabled: true,
      notionPropertyName: TEMPLATE_PROPERTIES.title,
      displayLabel: "Title",
      propertyType: "title" as const,
      required: true,
    },
    date: {
      enabled: true,
      notionPropertyName: TEMPLATE_PROPERTIES.date,
      displayLabel: "Date",
      propertyType: "date" as const,
      required: true,
    },
    description: {
      enabled: true,
      notionPropertyName: TEMPLATE_PROPERTIES.description,
      displayLabel: "Description",
      propertyType: "rich_text" as const,
      required: false,
    },
    location: {
      enabled: true,
      notionPropertyName: TEMPLATE_PROPERTIES.location,
      displayLabel: "Location",
      propertyType: "rich_text" as const,
      required: false,
    },
    gcalEventId: {
      enabled: true,
      notionPropertyName: TEMPLATE_PROPERTIES.gcalEventId,
      displayLabel: "GCal Event ID",
      propertyType: "rich_text" as const,
      required: false,
    },
    reminders: {
      enabled: false,
      notionPropertyName: TEMPLATE_PROPERTIES.reminders,
      displayLabel: "Reminders",
      propertyType: "number" as const,
      required: false,
    },
    attendees: {
      enabled: false,
      notionPropertyName: TEMPLATE_PROPERTIES.attendees,
      displayLabel: "Attendees",
      propertyType: "rich_text" as const,
      required: false,
    },
    organizer: {
      enabled: false,
      notionPropertyName: TEMPLATE_PROPERTIES.organizer,
      displayLabel: "Organizer",
      propertyType: "rich_text" as const,
      required: false,
    },
    conferenceLink: {
      enabled: false,
      notionPropertyName: TEMPLATE_PROPERTIES.conferenceLink,
      displayLabel: "Conference Link",
      propertyType: "rich_text" as const,
      required: false,
    },
    recurrence: {
      enabled: false,
      notionPropertyName: TEMPLATE_PROPERTIES.recurrence,
      displayLabel: "Recurrence",
      propertyType: "rich_text" as const,
      required: false,
    },
    color: {
      enabled: false,
      notionPropertyName: TEMPLATE_PROPERTIES.color,
      displayLabel: "Color",
      propertyType: "rich_text" as const,
      required: false,
    },
    visibility: {
      enabled: false,
      notionPropertyName: TEMPLATE_PROPERTIES.visibility,
      displayLabel: "Visibility",
      propertyType: "rich_text" as const,
      required: false,
    },
  };
}

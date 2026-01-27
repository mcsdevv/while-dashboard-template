/**
 * Migration utilities for field mapping configurations.
 * Handles conversion from legacy flat FieldMapping to ExtendedFieldMapping.
 */

import {
  DEFAULT_EXTENDED_FIELD_MAPPING,
  type ExtendedFieldMapping,
  type FieldMapping,
} from "./types";

/**
 * Check if a field mapping is in the legacy format.
 * Legacy format has title as a string, new format has title as an object.
 */
export function isLegacyFieldMapping(
  mapping: FieldMapping | ExtendedFieldMapping,
): mapping is FieldMapping {
  return typeof mapping.title === "string";
}

/**
 * Migrate a legacy FieldMapping to ExtendedFieldMapping.
 * Preserves existing property name mappings from the legacy format.
 * New fields are initialized with defaults (disabled).
 *
 * @param legacy - The legacy field mapping to migrate
 * @returns The migrated ExtendedFieldMapping
 */
export function migrateFieldMapping(legacy: FieldMapping): ExtendedFieldMapping {
  return {
    // Required fields - always enabled, preserve property names
    title: {
      ...DEFAULT_EXTENDED_FIELD_MAPPING.title,
      notionPropertyName: legacy.title,
    },
    date: {
      ...DEFAULT_EXTENDED_FIELD_MAPPING.date,
      notionPropertyName: legacy.date,
    },
    // Existing optional fields - preserve property names, keep enabled
    description: {
      ...DEFAULT_EXTENDED_FIELD_MAPPING.description,
      notionPropertyName: legacy.description,
      enabled: true,
    },
    location: {
      ...DEFAULT_EXTENDED_FIELD_MAPPING.location,
      notionPropertyName: legacy.location,
      enabled: true,
    },
    gcalEventId: {
      ...DEFAULT_EXTENDED_FIELD_MAPPING.gcalEventId,
      notionPropertyName: legacy.gcalEventId,
      enabled: true,
    },
    reminders: {
      ...DEFAULT_EXTENDED_FIELD_MAPPING.reminders,
      notionPropertyName: legacy.reminders,
      // Keep reminders disabled by default as in DEFAULT_EXTENDED_FIELD_MAPPING
      enabled: false,
    },
    // New fields - use defaults (disabled)
    attendees: { ...DEFAULT_EXTENDED_FIELD_MAPPING.attendees },
    organizer: { ...DEFAULT_EXTENDED_FIELD_MAPPING.organizer },
    conferenceLink: { ...DEFAULT_EXTENDED_FIELD_MAPPING.conferenceLink },
    recurrence: { ...DEFAULT_EXTENDED_FIELD_MAPPING.recurrence },
    color: { ...DEFAULT_EXTENDED_FIELD_MAPPING.color },
    visibility: { ...DEFAULT_EXTENDED_FIELD_MAPPING.visibility },
  };
}

/**
 * Safely convert any field mapping to ExtendedFieldMapping.
 * Auto-detects format and migrates if necessary.
 *
 * @param mapping - Either legacy or extended field mapping
 * @returns ExtendedFieldMapping (migrated if legacy)
 */
export function ensureExtendedFieldMapping(
  mapping: FieldMapping | ExtendedFieldMapping,
): ExtendedFieldMapping {
  if (isLegacyFieldMapping(mapping)) {
    return migrateFieldMapping(mapping);
  }
  return mapping;
}

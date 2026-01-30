import { describe, expect, it } from "vitest";
import { ensureExtendedFieldMapping, isLegacyFieldMapping, migrateFieldMapping } from "./migration";
import {
  DEFAULT_EXTENDED_FIELD_MAPPING,
  DEFAULT_FIELD_MAPPING,
  type ExtendedFieldMapping,
  type FieldMapping,
} from "./types";

describe("isLegacyFieldMapping", () => {
  it("returns true for legacy format (title is string)", () => {
    const legacy: FieldMapping = {
      title: "Title",
      date: "Date",
      description: "Description",
      location: "Location",
      gcalEventId: "GCal Event ID",
      reminders: "Reminders",
    };

    expect(isLegacyFieldMapping(legacy)).toBe(true);
  });

  it("returns true for DEFAULT_FIELD_MAPPING", () => {
    expect(isLegacyFieldMapping(DEFAULT_FIELD_MAPPING)).toBe(true);
  });

  it("returns false for extended format (title is object)", () => {
    expect(isLegacyFieldMapping(DEFAULT_EXTENDED_FIELD_MAPPING)).toBe(false);
  });

  it("returns false for custom extended mapping", () => {
    const extended: ExtendedFieldMapping = {
      ...DEFAULT_EXTENDED_FIELD_MAPPING,
      title: {
        ...DEFAULT_EXTENDED_FIELD_MAPPING.title,
        notionPropertyName: "Custom Title",
      },
    };

    expect(isLegacyFieldMapping(extended)).toBe(false);
  });
});

describe("migrateFieldMapping", () => {
  const customLegacy: FieldMapping = {
    title: "Event Name",
    date: "Event Date",
    description: "Event Description",
    location: "Event Location",
    gcalEventId: "Calendar ID",
    reminders: "Reminder Minutes",
  };

  describe("preserves custom property names", () => {
    it("preserves title property name", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.title.notionPropertyName).toBe("Event Name");
    });

    it("preserves date property name", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.date.notionPropertyName).toBe("Event Date");
    });

    it("preserves description property name", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.description.notionPropertyName).toBe("Event Description");
    });

    it("preserves location property name", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.location.notionPropertyName).toBe("Event Location");
    });

    it("preserves gcalEventId property name", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.gcalEventId.notionPropertyName).toBe("Calendar ID");
    });

    it("preserves reminders property name", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.reminders.notionPropertyName).toBe("Reminder Minutes");
    });
  });

  describe("sets correct enabled states", () => {
    it("title is always enabled", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.title.enabled).toBe(true);
    });

    it("date is always enabled", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.date.enabled).toBe(true);
    });

    it("description is enabled after migration", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.description.enabled).toBe(true);
    });

    it("location is enabled after migration", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.location.enabled).toBe(true);
    });

    it("gcalEventId is enabled after migration", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.gcalEventId.enabled).toBe(true);
    });

    it("reminders stays disabled after migration", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.reminders.enabled).toBe(false);
    });
  });

  describe("new fields are disabled by default", () => {
    const newFields = [
      "attendees",
      "organizer",
      "conferenceLink",
      "recurrence",
      "color",
      "visibility",
    ] as const;

    for (const field of newFields) {
      it(`${field} is disabled`, () => {
        const result = migrateFieldMapping(customLegacy);
        expect(result[field].enabled).toBe(false);
      });
    }
  });

  describe("new fields use default property names", () => {
    it("attendees uses default property name", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.attendees.notionPropertyName).toBe("Attendees");
    });

    it("organizer uses default property name", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.organizer.notionPropertyName).toBe("Organizer");
    });

    it("conferenceLink uses default property name", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.conferenceLink.notionPropertyName).toBe("Conference Link");
    });

    it("recurrence uses default property name", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.recurrence.notionPropertyName).toBe("Recurrence");
    });

    it("color uses default property name", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.color.notionPropertyName).toBe("Color");
    });

    it("visibility uses default property name", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.visibility.notionPropertyName).toBe("Visibility");
    });
  });

  describe("sets correct required flags", () => {
    it("title is required", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.title.required).toBe(true);
    });

    it("date is required", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.date.required).toBe(true);
    });

    it("all other fields are not required", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.description.required).toBe(false);
      expect(result.location.required).toBe(false);
      expect(result.gcalEventId.required).toBe(false);
      expect(result.reminders.required).toBe(false);
      expect(result.attendees.required).toBe(false);
      expect(result.organizer.required).toBe(false);
      expect(result.conferenceLink.required).toBe(false);
      expect(result.recurrence.required).toBe(false);
      expect(result.color.required).toBe(false);
      expect(result.visibility.required).toBe(false);
    });
  });

  describe("sets correct property types", () => {
    it("title has type 'title'", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.title.propertyType).toBe("title");
    });

    it("date has type 'date'", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.date.propertyType).toBe("date");
    });

    it("reminders has type 'number'", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.reminders.propertyType).toBe("number");
    });

    it("text fields have type 'rich_text'", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.description.propertyType).toBe("rich_text");
      expect(result.location.propertyType).toBe("rich_text");
      expect(result.gcalEventId.propertyType).toBe("rich_text");
      expect(result.attendees.propertyType).toBe("rich_text");
      expect(result.organizer.propertyType).toBe("rich_text");
      expect(result.recurrence.propertyType).toBe("rich_text");
    });

    it("conferenceLink uses url and color/visibility use select", () => {
      const result = migrateFieldMapping(customLegacy);
      expect(result.conferenceLink.propertyType).toBe("url");
      expect(result.color.propertyType).toBe("select");
      expect(result.visibility.propertyType).toBe("select");
    });
  });

  it("migrating DEFAULT_FIELD_MAPPING produces valid result", () => {
    const result = migrateFieldMapping(DEFAULT_FIELD_MAPPING);

    // All 12 fields should exist
    expect(Object.keys(result)).toHaveLength(12);

    // Each field should have all required properties
    const fieldKeys = Object.keys(result) as Array<keyof typeof result>;
    for (const key of fieldKeys) {
      const field = result[key];
      expect(field).toHaveProperty("enabled");
      expect(field).toHaveProperty("notionPropertyName");
      expect(field).toHaveProperty("displayLabel");
      expect(field).toHaveProperty("propertyType");
      expect(field).toHaveProperty("required");
    }
  });
});

describe("ensureExtendedFieldMapping", () => {
  it("migrates legacy format to extended", () => {
    const legacy: FieldMapping = {
      title: "My Title",
      date: "My Date",
      description: "My Desc",
      location: "My Location",
      gcalEventId: "My ID",
      reminders: "My Reminders",
    };

    const result = ensureExtendedFieldMapping(legacy);

    // Should be extended format (title is object)
    expect(typeof result.title).toBe("object");
    expect(result.title.notionPropertyName).toBe("My Title");
  });

  it("passes through extended format unchanged", () => {
    const extended: ExtendedFieldMapping = {
      ...DEFAULT_EXTENDED_FIELD_MAPPING,
      title: {
        ...DEFAULT_EXTENDED_FIELD_MAPPING.title,
        notionPropertyName: "Custom Title",
      },
    };

    const result = ensureExtendedFieldMapping(extended);

    // Should be the same object
    expect(result).toBe(extended);
    expect(result.title.notionPropertyName).toBe("Custom Title");
  });

  it("returns DEFAULT_EXTENDED_FIELD_MAPPING unchanged", () => {
    const result = ensureExtendedFieldMapping(DEFAULT_EXTENDED_FIELD_MAPPING);
    expect(result).toBe(DEFAULT_EXTENDED_FIELD_MAPPING);
  });

  it("idempotent - migrating twice produces same result", () => {
    const legacy: FieldMapping = DEFAULT_FIELD_MAPPING;

    const firstMigration = ensureExtendedFieldMapping(legacy);
    const secondMigration = ensureExtendedFieldMapping(firstMigration);

    // Second call should pass through unchanged
    expect(secondMigration).toBe(firstMigration);
  });
});

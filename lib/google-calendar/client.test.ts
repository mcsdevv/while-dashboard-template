/**
 * Tests for Google Calendar client - specifically parseRRule helper
 */
import { describe, expect, test, vi } from "vitest";

// Mock settings module
vi.mock("@/lib/settings", () => ({
  GCAL_COLORS: {
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
  },
  getGoogleConfig: vi.fn(),
}));

// Mock Google Calendar API
vi.mock("@googleapis/calendar", () => ({
  calendar: vi.fn(),
}));

// Mock Google Auth Library
vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn(),
}));

// Mock types
vi.mock("@/lib/types", () => ({
  eventSchema: {},
}));

import { gcalEventToEvent } from "./client";

describe("gcalEventToEvent - recurrence parsing", () => {
  test("parses daily frequency", () => {
    const result = gcalEventToEvent({
      id: "test",
      summary: "Daily Meeting",
      start: { dateTime: "2025-01-26T10:00:00Z" },
      end: { dateTime: "2025-01-26T11:00:00Z" },
      recurrence: ["RRULE:FREQ=DAILY"],
    });

    expect(result?.recurrence).toBe("Daily");
  });

  test("parses weekly with specific day", () => {
    const result = gcalEventToEvent({
      id: "test",
      summary: "Weekly Monday",
      start: { dateTime: "2025-01-26T10:00:00Z" },
      end: { dateTime: "2025-01-26T11:00:00Z" },
      recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO"],
    });

    expect(result?.recurrence).toBe("Weekly on Monday");
  });

  test("parses weekly with multiple days", () => {
    const result = gcalEventToEvent({
      id: "test",
      summary: "MWF Meeting",
      start: { dateTime: "2025-01-26T10:00:00Z" },
      end: { dateTime: "2025-01-26T11:00:00Z" },
      recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR"],
    });

    expect(result?.recurrence).toBe("Weekly on Monday, Wednesday, and Friday");
  });

  test("parses monthly on specific day", () => {
    const result = gcalEventToEvent({
      id: "test",
      summary: "Monthly Meeting",
      start: { dateTime: "2025-01-26T10:00:00Z" },
      end: { dateTime: "2025-01-26T11:00:00Z" },
      recurrence: ["RRULE:FREQ=MONTHLY;BYMONTHDAY=15"],
    });

    expect(result?.recurrence).toBe("Monthly on day 15");
  });

  test("parses yearly frequency", () => {
    const result = gcalEventToEvent({
      id: "test",
      summary: "Annual Review",
      start: { dateTime: "2025-01-26T10:00:00Z" },
      end: { dateTime: "2025-01-26T11:00:00Z" },
      recurrence: ["RRULE:FREQ=YEARLY"],
    });

    expect(result?.recurrence).toBe("Yearly");
  });

  test("handles event without recurrence", () => {
    const result = gcalEventToEvent({
      id: "test",
      summary: "One-time Event",
      start: { dateTime: "2025-01-26T10:00:00Z" },
      end: { dateTime: "2025-01-26T11:00:00Z" },
    });

    expect(result?.recurrence).toBeUndefined();
  });
});

describe("gcalEventToEvent - extended fields", () => {
  test("extracts attendees", () => {
    const result = gcalEventToEvent({
      id: "test",
      summary: "Team Meeting",
      start: { dateTime: "2025-01-26T10:00:00Z" },
      end: { dateTime: "2025-01-26T11:00:00Z" },
      attendees: [
        { displayName: "John Doe", email: "john@example.com" },
        { displayName: "Jane Smith", email: "jane@example.com" },
        { email: "me@example.com", self: true }, // Should be filtered out
      ],
    });

    expect(result?.attendees).toEqual(["John Doe", "Jane Smith"]);
  });

  test("extracts organizer", () => {
    const result = gcalEventToEvent({
      id: "test",
      summary: "Meeting",
      start: { dateTime: "2025-01-26T10:00:00Z" },
      end: { dateTime: "2025-01-26T11:00:00Z" },
      organizer: { displayName: "Boss", email: "boss@example.com" },
    });

    expect(result?.organizer).toBe("Boss");
  });

  test("extracts conference link", () => {
    const result = gcalEventToEvent({
      id: "test",
      summary: "Video Call",
      start: { dateTime: "2025-01-26T10:00:00Z" },
      end: { dateTime: "2025-01-26T11:00:00Z" },
      conferenceData: {
        entryPoints: [
          { entryPointType: "video", uri: "https://meet.google.com/abc-defg-hij" },
          { entryPointType: "phone", uri: "tel:+1234567890" },
        ],
      },
    });

    expect(result?.conferenceLink).toBe("https://meet.google.com/abc-defg-hij");
  });

  test("extracts color name from colorId", () => {
    const result = gcalEventToEvent({
      id: "test",
      summary: "Colored Event",
      start: { dateTime: "2025-01-26T10:00:00Z" },
      end: { dateTime: "2025-01-26T11:00:00Z" },
      colorId: "11", // Tomato
    });

    expect(result?.color).toBe("Tomato");
  });

  test("extracts visibility", () => {
    const result = gcalEventToEvent({
      id: "test",
      summary: "Private Event",
      start: { dateTime: "2025-01-26T10:00:00Z" },
      end: { dateTime: "2025-01-26T11:00:00Z" },
      visibility: "private",
    });

    expect(result?.visibility).toBe("private");
  });
});

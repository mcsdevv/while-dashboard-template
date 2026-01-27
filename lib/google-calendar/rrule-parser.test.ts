import { describe, expect, test } from "vitest";
import { parseRRule } from "./rrule-parser";

describe("parseRRule", () => {
  describe("daily recurrence", () => {
    test("simple daily", () => {
      expect(parseRRule("RRULE:FREQ=DAILY")).toBe("Daily");
    });

    test("every N days", () => {
      expect(parseRRule("RRULE:FREQ=DAILY;INTERVAL=2")).toBe("Every 2 days");
      expect(parseRRule("RRULE:FREQ=DAILY;INTERVAL=3")).toBe("Every 3 days");
    });

    test("without RRULE prefix", () => {
      expect(parseRRule("FREQ=DAILY")).toBe("Daily");
    });
  });

  describe("weekly recurrence", () => {
    test("simple weekly", () => {
      expect(parseRRule("RRULE:FREQ=WEEKLY")).toBe("Weekly");
    });

    test("weekly on single day", () => {
      expect(parseRRule("RRULE:FREQ=WEEKLY;BYDAY=MO")).toBe("Weekly on Monday");
      expect(parseRRule("RRULE:FREQ=WEEKLY;BYDAY=FR")).toBe("Weekly on Friday");
    });

    test("weekly on two days", () => {
      expect(parseRRule("RRULE:FREQ=WEEKLY;BYDAY=TU,TH")).toBe("Weekly on Tuesday and Thursday");
    });

    test("weekly on multiple days", () => {
      expect(parseRRule("RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR")).toBe(
        "Weekly on Monday, Wednesday, and Friday",
      );
    });

    test("every N weeks", () => {
      expect(parseRRule("RRULE:FREQ=WEEKLY;INTERVAL=2")).toBe("Every 2 weeks");
      expect(parseRRule("RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH")).toBe(
        "Every 2 weeks on Tuesday and Thursday",
      );
    });
  });

  describe("monthly recurrence", () => {
    test("simple monthly", () => {
      expect(parseRRule("RRULE:FREQ=MONTHLY")).toBe("Monthly");
    });

    test("monthly by day of month", () => {
      expect(parseRRule("RRULE:FREQ=MONTHLY;BYMONTHDAY=1")).toBe("Monthly on day 1");
      expect(parseRRule("RRULE:FREQ=MONTHLY;BYMONTHDAY=15")).toBe("Monthly on day 15");
    });

    test("monthly by week position", () => {
      expect(parseRRule("RRULE:FREQ=MONTHLY;BYDAY=1MO")).toBe("Monthly on the first Monday");
      expect(parseRRule("RRULE:FREQ=MONTHLY;BYDAY=2TU")).toBe("Monthly on the second Tuesday");
      expect(parseRRule("RRULE:FREQ=MONTHLY;BYDAY=3WE")).toBe("Monthly on the third Wednesday");
      expect(parseRRule("RRULE:FREQ=MONTHLY;BYDAY=-1FR")).toBe("Monthly on the last Friday");
    });

    test("every N months", () => {
      expect(parseRRule("RRULE:FREQ=MONTHLY;INTERVAL=2")).toBe("Every 2 months");
      expect(parseRRule("RRULE:FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=15")).toBe(
        "Every 3 months on day 15",
      );
    });
  });

  describe("yearly recurrence", () => {
    test("simple yearly", () => {
      expect(parseRRule("RRULE:FREQ=YEARLY")).toBe("Yearly");
    });

    test("yearly with month", () => {
      expect(parseRRule("RRULE:FREQ=YEARLY;BYMONTH=3")).toBe("Yearly in March");
      expect(parseRRule("RRULE:FREQ=YEARLY;BYMONTH=12")).toBe("Yearly in December");
    });

    test("yearly with month and day", () => {
      expect(parseRRule("RRULE:FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=15")).toBe("Yearly on March 15");
      expect(parseRRule("RRULE:FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25")).toBe(
        "Yearly on December 25",
      );
    });

    test("every N years", () => {
      expect(parseRRule("RRULE:FREQ=YEARLY;INTERVAL=2")).toBe("Every 2 years");
      expect(parseRRule("RRULE:FREQ=YEARLY;INTERVAL=4;BYMONTH=2;BYMONTHDAY=29")).toBe(
        "Every 4 years on February 29",
      );
    });
  });

  describe("edge cases", () => {
    test("empty string returns unknown", () => {
      expect(parseRRule("")).toBe("Unknown recurrence");
    });

    test("null/undefined returns unknown", () => {
      expect(parseRRule(null as unknown as string)).toBe("Unknown recurrence");
      expect(parseRRule(undefined as unknown as string)).toBe("Unknown recurrence");
    });

    test("invalid format returns unknown", () => {
      expect(parseRRule("not a valid rrule")).toBe("Unknown recurrence");
      expect(parseRRule("FREQ=INVALID")).toBe("Unknown recurrence");
    });

    test("ignores UNTIL clause", () => {
      expect(parseRRule("RRULE:FREQ=DAILY;UNTIL=20251231T235959Z")).toBe("Daily");
    });

    test("ignores COUNT clause", () => {
      expect(parseRRule("RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=10")).toBe("Weekly on Monday");
    });

    test("case insensitive prefix", () => {
      expect(parseRRule("rrule:FREQ=DAILY")).toBe("Daily");
      expect(parseRRule("RRule:FREQ=DAILY")).toBe("Daily");
    });
  });
});

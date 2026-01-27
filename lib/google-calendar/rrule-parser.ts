/**
 * Parse RRULE (RFC 5545) format to human-readable text.
 * Used to display Google Calendar recurrence patterns in a friendly format.
 */

const DAY_NAMES: Record<string, string> = {
  SU: "Sunday",
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
};

const MONTH_NAMES: Record<string, string> = {
  "1": "January",
  "2": "February",
  "3": "March",
  "4": "April",
  "5": "May",
  "6": "June",
  "7": "July",
  "8": "August",
  "9": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};

const ORDINAL_NAMES: Record<string, string> = {
  "1": "first",
  "2": "second",
  "3": "third",
  "4": "fourth",
  "5": "fifth",
  "-1": "last",
};

/**
 * Parse an RRULE string into its component parts.
 */
function parseRRuleParts(rrule: string): Record<string, string> {
  // Strip RRULE: prefix if present
  const normalized = rrule.replace(/^RRULE:/i, "");
  const parts: Record<string, string> = {};

  for (const segment of normalized.split(";")) {
    const [key, value] = segment.split("=");
    if (key && value) {
      parts[key.toUpperCase()] = value;
    }
  }

  return parts;
}

/**
 * Format a list of day abbreviations into readable text.
 * "MO,WE,FR" → "Monday, Wednesday, Friday"
 */
function formatDays(byday: string): string {
  // Handle positional days like "2MO" (second Monday)
  const dayPattern = /^(-?\d)?([A-Z]{2})$/;
  const days = byday.split(",").map((d) => {
    const match = d.match(dayPattern);
    if (match) {
      const [, position, dayCode] = match;
      const dayName = DAY_NAMES[dayCode] || dayCode;
      if (position) {
        const ordinal = ORDINAL_NAMES[position] || `${position}th`;
        return `the ${ordinal} ${dayName}`;
      }
      return dayName;
    }
    return DAY_NAMES[d] || d;
  });

  if (days.length === 1) {
    return days[0];
  }
  if (days.length === 2) {
    return `${days[0]} and ${days[1]}`;
  }
  return `${days.slice(0, -1).join(", ")}, and ${days[days.length - 1]}`;
}

/**
 * Convert an RRULE string to human-readable text.
 *
 * @param rrule - The RRULE string (e.g., "RRULE:FREQ=WEEKLY;BYDAY=MO")
 * @returns Human-readable recurrence description
 *
 * @example
 * parseRRule("RRULE:FREQ=DAILY") // "Daily"
 * parseRRule("RRULE:FREQ=WEEKLY;BYDAY=MO") // "Weekly on Monday"
 * parseRRule("RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH") // "Every 2 weeks on Tuesday and Thursday"
 * parseRRule("RRULE:FREQ=MONTHLY;BYMONTHDAY=15") // "Monthly on day 15"
 * parseRRule("RRULE:FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=15") // "Yearly on March 15"
 */
export function parseRRule(rrule: string): string {
  if (!rrule || typeof rrule !== "string") {
    return "Unknown recurrence";
  }

  try {
    const parts = parseRRuleParts(rrule);
    const freq = parts.FREQ?.toUpperCase();
    const interval = parts.INTERVAL ? parseInt(parts.INTERVAL, 10) : 1;

    if (!freq) {
      return "Unknown recurrence";
    }

    switch (freq) {
      case "DAILY": {
        if (interval === 1) {
          return "Daily";
        }
        return `Every ${interval} days`;
      }

      case "WEEKLY": {
        const days = parts.BYDAY ? formatDays(parts.BYDAY) : "";
        if (interval === 1) {
          return days ? `Weekly on ${days}` : "Weekly";
        }
        return days ? `Every ${interval} weeks on ${days}` : `Every ${interval} weeks`;
      }

      case "MONTHLY": {
        // By day of month (e.g., BYMONTHDAY=15)
        if (parts.BYMONTHDAY) {
          const day = parts.BYMONTHDAY;
          if (interval === 1) {
            return `Monthly on day ${day}`;
          }
          return `Every ${interval} months on day ${day}`;
        }

        // By day position (e.g., BYDAY=2MO for second Monday)
        if (parts.BYDAY) {
          const days = formatDays(parts.BYDAY);
          if (interval === 1) {
            return `Monthly on ${days}`;
          }
          return `Every ${interval} months on ${days}`;
        }

        return interval === 1 ? "Monthly" : `Every ${interval} months`;
      }

      case "YEARLY": {
        const month = parts.BYMONTH ? MONTH_NAMES[parts.BYMONTH] : "";
        const day = parts.BYMONTHDAY || "";

        if (month && day) {
          if (interval === 1) {
            return `Yearly on ${month} ${day}`;
          }
          return `Every ${interval} years on ${month} ${day}`;
        }

        if (month) {
          if (interval === 1) {
            return `Yearly in ${month}`;
          }
          return `Every ${interval} years in ${month}`;
        }

        return interval === 1 ? "Yearly" : `Every ${interval} years`;
      }

      default:
        return "Unknown recurrence";
    }
  } catch {
    return "Unknown recurrence";
  }
}

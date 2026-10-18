import type { calendar_v3 } from "@googleapis/calendar";

function eventTime(value: calendar_v3.Schema$EventDateTime | null | undefined) {
  // Time zone names and UTC offsets can differ while representing the same instant.
  return value?.date ?? (value?.dateTime ? new Date(value.dateTime).toISOString() : null);
}

function reminders(value: calendar_v3.Schema$Event["reminders"]) {
  return {
    useDefault: value?.useDefault ?? true,
    overrides: (value?.overrides ?? []).map((item) => `${item.method}:${item.minutes}`).sort(),
  };
}

/** Compare only fields this patch actually writes. */
export function isUnchangedGcalPatch(
  current: calendar_v3.Schema$Event,
  patch: calendar_v3.Schema$Event,
): boolean {
  return Object.entries(patch).every(([key, value]) => {
    if (value === undefined) return true;
    if (key === "start" || key === "end") {
      return eventTime(current[key]) === eventTime(patch[key]);
    }
    if (key === "extendedProperties") {
      return (
        current.extendedProperties?.private?.notion_page_id ===
        patch.extendedProperties?.private?.notion_page_id
      );
    }
    if (key === "reminders") {
      return (
        JSON.stringify(reminders(current.reminders)) === JSON.stringify(reminders(patch.reminders))
      );
    }
    return (current[key as keyof calendar_v3.Schema$Event] ?? "") === (value ?? "");
  });
}

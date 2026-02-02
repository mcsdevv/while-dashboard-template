"use client";

import {
  ScheduleXCalendar,
  useNextCalendarApp,
} from "@schedule-x/react";
import {
  createViewDay,
  createViewMonthGrid,
  createViewWeek,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import "temporal-polyfill/global";
import "@schedule-x/theme-default/dist/index.css";
import type { SyncLog } from "@/lib/types";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface CalendarViewProps {
  logs: SyncLog[];
}

function toPlainDate(date: Date | string): Temporal.PlainDate {
  const d = typeof date === "string" ? new Date(date) : date;
  return Temporal.PlainDate.from({
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  });
}

function transformLogsToEvents(logs: SyncLog[]) {
  // Deduplicate by eventId, keeping most recent log per event
  const eventMap = new Map<string, SyncLog>();

  for (const log of logs) {
    if (!log.eventStartTime || !log.eventEndTime) continue;
    // Skip cancelled events
    if (log.eventStatus === "cancelled") continue;

    const existing = eventMap.get(log.eventId);
    if (!existing) {
      eventMap.set(log.eventId, log);
    } else {
      const existingTime =
        typeof existing.timestamp === "string"
          ? new Date(existing.timestamp).getTime()
          : existing.timestamp.getTime();
      const logTime =
        typeof log.timestamp === "string"
          ? new Date(log.timestamp).getTime()
          : log.timestamp.getTime();
      if (logTime > existingTime) {
        eventMap.set(log.eventId, log);
      }
    }
  }

  return Array.from(eventMap.values()).map((log) => ({
    id: log.eventId,
    title: log.eventTitle,
    start: toPlainDate(log.eventStartTime!),
    end: toPlainDate(log.eventEndTime!),
  }));
}

export function CalendarView({ logs }: CalendarViewProps) {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [eventsService] = useState(() => createEventsServicePlugin());

  // Transform SyncLog[] to calendar events
  const calendarEvents = useMemo(() => transformLogsToEvents(logs), [logs]);

  const calendar = useNextCalendarApp({
    views: [createViewMonthGrid(), createViewWeek(), createViewDay()],
    defaultView: "month-grid",
    events: calendarEvents,
    plugins: [eventsService],
    isDark: resolvedTheme === "dark",
    callbacks: {
      onEventClick(event: { id: string | number }) {
        router.push(`/events/${encodeURIComponent(String(event.id))}`);
      },
    },
  });

  // Update theme when it changes
  useEffect(() => {
    if (calendar) {
      calendar.setTheme(resolvedTheme === "dark" ? "dark" : "light");
    }
  }, [calendar, resolvedTheme]);

  return (
    <div className="sx-react-calendar-wrapper">
      <ScheduleXCalendar calendarApp={calendar} />
    </div>
  );
}

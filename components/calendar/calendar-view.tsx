"use client";

import { useCalendarPreferences } from "@/components/shell/calendar-preferences-context";
import type { SyncLog } from "@/lib/types";
import { Button, Card, CardContent } from "@/shared/ui";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface CalendarViewProps {
  logs: SyncLog[];
  searchQuery?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

type ViewMode = "day" | "week" | "month";

function formatDuration(start: Date, end: Date): string {
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

function DayView({
  date,
  events,
  onEventClick,
}: {
  date: Date;
  events: CalendarEvent[];
  onEventClick: (id: string) => void;
}) {
  const dayEvents = events
    .filter((e) => isSameDay(e.start, date) || (e.start <= date && e.end >= date))
    .toSorted((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <div className="p-4 space-y-2">
      {dayEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No events scheduled</p>
      ) : (
        dayEvents.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => onEventClick(event.id)}
            className="w-full flex items-center gap-3 bg-muted p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {format(event.start, "h:mm a")} ({formatDuration(event.start, event.end)})
            </span>
            <span className="text-sm font-medium truncate">{event.title}</span>
          </button>
        ))
      )}
    </div>
  );
}

function WeekView({
  currentDate,
  events,
  onEventClick,
  weekStartsOn,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (id: string) => void;
  weekStartsOn: 0 | 1;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekDays =
    weekStartsOn === 1
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  const getEventsForDay = (day: Date) =>
    events.filter(
      (event) => isSameDay(event.start, day) || (event.start <= day && event.end >= day),
    );

  return (
    <>
      {/* Week Day Headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {days.map((day, index) => (
          <div key={day.toISOString()} className="bg-muted px-2 py-3 text-center">
            <div className="text-sm font-medium text-muted-foreground">{weekDays[index]}</div>
            <div className={`text-lg ${isToday(day) ? "font-bold" : ""}`}>{format(day, "d")}</div>
          </div>
        ))}
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isDayToday = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[200px] border-b border-r border-border p-2 ${
                index === 6 ? "border-r-0" : ""
              } ${isDayToday ? "bg-accent/20" : ""}`}
            >
              <div className="space-y-1">
                {dayEvents.slice(0, 5).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onEventClick(event.id)}
                    className="w-full truncate bg-muted px-1.5 py-0.5 text-left text-xs text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {format(event.start, "h:mm a")} ({formatDuration(event.start, event.end)}){" "}
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 5 && (
                  <div className="px-1.5 text-xs text-muted-foreground">
                    +{dayEvents.length - 5} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function MonthView({
  currentDate,
  events,
  onEventClick,
  weekStartsOn,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (id: string) => void;
  weekStartsOn: 0 | 1;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = addDays(calendarStart, 34);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays =
    weekStartsOn === 1
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getEventsForDay = (day: Date) =>
    events.filter(
      (event) => isSameDay(event.start, day) || (event.start <= day && event.end >= day),
    );

  return (
    <>
      {/* Week Day Headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-muted px-2 py-3 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] border-b border-r border-border p-2 ${
                index % 7 === 6 ? "border-r-0" : ""
              } ${!isCurrentMonth ? "bg-muted/30" : ""}`}
            >
              {/* Day Number */}
              <div className="mb-1 flex justify-end">
                <span
                  className={`flex h-7 w-7 items-center justify-center text-sm ${
                    isDayToday
                      ? "bg-foreground text-background font-medium"
                      : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onEventClick(event.id)}
                    className="w-full truncate bg-muted px-1.5 py-0.5 text-left text-xs text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {format(event.start, "h:mm a")} ({formatDuration(event.start, event.end)}){" "}
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="px-1.5 text-xs text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function transformLogsToEvents(logs: SyncLog[]): CalendarEvent[] {
  // Build mapping of linked IDs from logs with both cross-references
  // This allows deduplication when the same event appears with different IDs
  // (Notion UUID vs Google Calendar ID) from bidirectional sync
  const notionToGcal = new Map<string, string>();

  for (const log of logs) {
    if (log.gcalEventId && log.notionPageId) {
      notionToGcal.set(log.notionPageId, log.gcalEventId);
    }
  }

  // Get canonical key for an event (prefer gcalEventId for consistency)
  const getCanonicalKey = (log: SyncLog): string => {
    if (log.gcalEventId) return log.gcalEventId;
    if (notionToGcal.has(log.eventId)) return notionToGcal.get(log.eventId)!;
    return log.eventId;
  };

  const eventMap = new Map<string, SyncLog>();

  for (const log of logs) {
    if (!log.eventStartTime || !log.eventEndTime) continue;
    if (log.eventStatus === "cancelled") continue;

    const key = getCanonicalKey(log);
    const existing = eventMap.get(key);

    if (!existing) {
      eventMap.set(key, log);
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
        eventMap.set(key, log);
      }
    }
  }

  return Array.from(eventMap.values()).map((log) => ({
    id: log.gcalEventId || log.notionPageId || log.eventId,
    title: log.eventTitle,
    start: new Date(log.eventStartTime!),
    end: new Date(log.eventEndTime!),
  }));
}

export function CalendarView({ logs, searchQuery }: CalendarViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const { weekStartsOn } = useCalendarPreferences();

  const events = useMemo(() => {
    const allEvents = transformLogsToEvents(logs);
    if (!searchQuery) return allEvents;

    const query = searchQuery.toLowerCase();
    return allEvents.filter((event) => event.title.toLowerCase().includes(query));
  }, [logs, searchQuery]);

  const handlePrev = () => {
    if (viewMode === "day") setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === "day") setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleEventClick = (eventId: string) => {
    router.push(`/events/${encodeURIComponent(eventId)}`);
  };

  const getHeaderTitle = () => {
    if (viewMode === "day") return format(currentDate, "EEEE, MMMM d, yyyy");
    if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn });
      return `${format(weekStart, "MMM d")} - ${format(weekEnd, "d, yyyy")}`;
    }
    return format(currentDate, "MMMM yyyy");
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Calendar Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                aria-label={`Previous ${viewMode}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                aria-label={`Next ${viewMode}`}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <h2 className="text-lg font-medium">{getHeaderTitle()}</h2>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-input">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("day")}
              className="rounded-none border-0"
            >
              Day
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("week")}
              className="rounded-none border-0 border-x border-input"
            >
              Week
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("month")}
              className="rounded-none border-0"
            >
              Month
            </Button>
          </div>
        </div>

        {/* View Content */}
        {viewMode === "day" && (
          <DayView date={currentDate} events={events} onEventClick={handleEventClick} />
        )}
        {viewMode === "week" && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
            weekStartsOn={weekStartsOn}
          />
        )}
        {viewMode === "month" && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
            weekStartsOn={weekStartsOn}
          />
        )}
      </CardContent>
    </Card>
  );
}

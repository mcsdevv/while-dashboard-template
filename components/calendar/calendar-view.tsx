"use client";

import type { SyncLog } from "@/lib/types";
import { Button, Card, CardContent } from "@/shared/ui";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface CalendarViewProps {
  logs: SyncLog[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

function transformLogsToEvents(logs: SyncLog[]): CalendarEvent[] {
  const eventMap = new Map<string, SyncLog>();

  for (const log of logs) {
    if (!log.eventStartTime || !log.eventEndTime) continue;
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
    start: new Date(log.eventStartTime!),
    end: new Date(log.eventEndTime!),
  }));
}

export function CalendarView({ logs }: CalendarViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  const events = useMemo(() => transformLogsToEvents(logs), [logs]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) =>
    events.filter(
      (event) =>
        isSameDay(event.start, day) ||
        (event.start <= day && event.end >= day)
    );

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleEventClick = (eventId: string) => {
    router.push(`/events/${encodeURIComponent(eventId)}`);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
                onClick={handlePrevMonth}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <h2 className="text-lg font-medium">
            {format(currentDate, "MMMM yyyy")}
          </h2>
        </div>

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
                      onClick={() => handleEventClick(event.id)}
                      className="w-full truncate bg-muted px-1.5 py-0.5 text-left text-xs text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
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
      </CardContent>
    </Card>
  );
}

"use client";

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";

type WeekStartDay = 0 | 1; // 0 = Sunday, 1 = Monday

interface CalendarPreferencesContextValue {
  weekStartsOn: WeekStartDay;
  setWeekStartsOn: (day: WeekStartDay) => void;
  timezone: string;
  setTimezone: (tz: string) => void;
}

const CalendarPreferencesContext = createContext<CalendarPreferencesContextValue | null>(null);

const STORAGE_KEY = "calendar-preferences";
const DEFAULT_WEEK_START: WeekStartDay = 1; // Monday

function getDefaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function CalendarPreferencesProvider({ children }: { children: ReactNode }) {
  const [weekStartsOn, setWeekStartsOnState] = useState<WeekStartDay>(DEFAULT_WEEK_START);
  const [timezone, setTimezoneState] = useState<string>(getDefaultTimezone);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.weekStartsOn === 0 || parsed.weekStartsOn === 1) {
          setWeekStartsOnState(parsed.weekStartsOn);
        }
        if (typeof parsed.timezone === "string" && parsed.timezone) {
          setTimezoneState(parsed.timezone);
        }
      } catch {
        // Invalid data, use defaults
      }
    }
  }, []);

  const setWeekStartsOn = useCallback(
    (day: WeekStartDay) => {
      setWeekStartsOnState(day);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ weekStartsOn: day, timezone }));
    },
    [timezone],
  );

  const setTimezone = useCallback(
    (tz: string) => {
      setTimezoneState(tz);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ weekStartsOn, timezone: tz }));
    },
    [weekStartsOn],
  );

  return (
    <CalendarPreferencesContext.Provider
      value={{ weekStartsOn, setWeekStartsOn, timezone, setTimezone }}
    >
      {children}
    </CalendarPreferencesContext.Provider>
  );
}

export function useCalendarPreferences() {
  const context = useContext(CalendarPreferencesContext);
  if (!context) {
    throw new Error("useCalendarPreferences must be used within a CalendarPreferencesProvider");
  }
  return context;
}

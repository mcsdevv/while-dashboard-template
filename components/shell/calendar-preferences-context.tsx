"use client";

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";

type WeekStartDay = 0 | 1; // 0 = Sunday, 1 = Monday

interface CalendarPreferencesContextValue {
  weekStartsOn: WeekStartDay;
  setWeekStartsOn: (day: WeekStartDay) => void;
}

const CalendarPreferencesContext = createContext<CalendarPreferencesContextValue | null>(null);

const STORAGE_KEY = "calendar-preferences";
const DEFAULT_WEEK_START: WeekStartDay = 1; // Monday

export function CalendarPreferencesProvider({ children }: { children: ReactNode }) {
  const [weekStartsOn, setWeekStartsOnState] = useState<WeekStartDay>(DEFAULT_WEEK_START);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.weekStartsOn === 0 || parsed.weekStartsOn === 1) {
          setWeekStartsOnState(parsed.weekStartsOn);
        }
      } catch {
        // Invalid data, use default
      }
    }
  }, []);

  const setWeekStartsOn = useCallback((day: WeekStartDay) => {
    setWeekStartsOnState(day);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ weekStartsOn: day }));
  }, []);

  return (
    <CalendarPreferencesContext.Provider value={{ weekStartsOn, setWeekStartsOn }}>
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

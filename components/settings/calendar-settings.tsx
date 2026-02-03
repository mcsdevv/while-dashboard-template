"use client";

import { useCalendarPreferences } from "@/components/shell/calendar-preferences-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import { Calendar } from "lucide-react";

const dayLabels: Record<0 | 1, string> = {
  0: "Sunday",
  1: "Monday",
};

export function CalendarSettings() {
  const { weekStartsOn, setWeekStartsOn } = useCalendarPreferences();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Calendar
        </CardTitle>
        <CardDescription>Customize how your calendar is displayed</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label className="text-sm">Week starts on</Label>
          <Select
            value={String(weekStartsOn)}
            onValueChange={(value) => setWeekStartsOn(Number(value) as 0 | 1)}
          >
            <SelectTrigger className="w-32">
              <SelectValue>{dayLabels[weekStartsOn]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Monday</SelectItem>
              <SelectItem value="0">Sunday</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

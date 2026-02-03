"use client";

import { Input, Select, SelectContent, SelectItem, SelectTrigger } from "@/shared/ui";
import { Globe } from "lucide-react";
import { useMemo, useState } from "react";

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
}

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];

function getTimezoneLabel(tz: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(now);
    const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    const city = tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
    return `${city} (${offset})`;
  } catch {
    return tz;
  }
}

export function TimezoneSelect({ value, onChange }: TimezoneSelectProps) {
  const [search, setSearch] = useState("");

  const allTimezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return COMMON_TIMEZONES;
    }
  }, []);

  const filteredTimezones = useMemo(() => {
    const query = search.toLowerCase();
    if (!query) {
      const common = COMMON_TIMEZONES.filter((tz) => allTimezones.includes(tz));
      const others = allTimezones.filter((tz) => !COMMON_TIMEZONES.includes(tz));
      return [...common, ...others].slice(0, 50);
    }
    return allTimezones
      .filter(
        (tz) =>
          tz.toLowerCase().includes(query) || getTimezoneLabel(tz).toLowerCase().includes(query),
      )
      .slice(0, 50);
  }, [search, allTimezones]);

  const currentLabel = getTimezoneLabel(value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px] h-8 text-sm" aria-label="Select timezone">
        <Globe className="h-3.5 w-3.5 mr-1.5 opacity-50 shrink-0" />
        <span className="truncate">{currentLabel}</span>
      </SelectTrigger>
      <SelectContent>
        <div className="p-2 border-b border-border">
          <Input
            placeholder="Search timezones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredTimezones.map((tz) => (
            <SelectItem key={tz} value={tz}>
              {getTimezoneLabel(tz)}
            </SelectItem>
          ))}
          {filteredTimezones.length === 0 && (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No timezones found
            </div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
}

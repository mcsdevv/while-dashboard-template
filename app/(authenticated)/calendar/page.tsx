"use client";

import { CalendarView } from "@/components/calendar/calendar-view";
import type { SyncLog } from "@/lib/types";
import {
  AutoRefreshToggle,
  Card,
  CardContent,
  Input,
  RefreshButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Skeleton,
} from "@/shared/ui";
import { useCallback, useEffect, useState } from "react";

type TimeWindow = "24h" | "7d" | "30d" | "90d";

export default function CalendarPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("90d");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const response = await fetch(`/api/events?window=${timeWindow}`);
        if (response.ok) {
          const data = await response.json();
          setLogs(data || []);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [timeWindow],
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchLogs(true), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const timeWindowLabels: Record<TimeWindow, string> = {
    "24h": "Last 24 Hours",
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    "90d": "Last 90 Days",
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">View synced events on a calendar</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[200px]"
            aria-label="Search events"
          />
          <AutoRefreshToggle checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          <RefreshButton onClick={() => fetchLogs(true)} loading={refreshing} />
          <Select value={timeWindow} onValueChange={(value) => setTimeWindow(value as TimeWindow)}>
            <SelectTrigger className="w-[180px]" aria-label="Select time window">
              {timeWindowLabels[timeWindow]}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">{timeWindowLabels["24h"]}</SelectItem>
              <SelectItem value="7d">{timeWindowLabels["7d"]}</SelectItem>
              <SelectItem value="30d">{timeWindowLabels["30d"]}</SelectItem>
              <SelectItem value="90d">{timeWindowLabels["90d"]}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-[600px] w-full" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <CalendarView logs={logs} searchQuery={searchQuery} />
      )}
    </div>
  );
}

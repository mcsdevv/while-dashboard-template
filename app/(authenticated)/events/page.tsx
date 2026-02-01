"use client";

import { EventsTable } from "@/components/events/events-table";
import type { SyncLog } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Skeleton,
} from "@/shared/ui";
import { useEffect, useState } from "react";

const SKELETON_ROWS = ["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4", "skeleton-5"];

type TimeWindow = "24h" | "7d" | "30d" | "90d";

export default function EventsPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("24h");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
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
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [timeWindow]);

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
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View event history and track changes over time
          </p>
        </div>
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

      {/* Events Table */}
      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {SKELETON_ROWS.map((row) => (
                <Skeleton key={row} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EventsTable logs={logs} />
      )}
    </div>
  );
}

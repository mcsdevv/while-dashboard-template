"use client";

import type { SyncMetrics } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ActivityTimelineChartProps {
  metrics: SyncMetrics | null;
  timeWindow: "24h" | "7d" | "30d" | "90d";
}

export function ActivityTimelineChart({ metrics, timeWindow }: ActivityTimelineChartProps) {
  const chartData = useMemo(() => {
    if (!metrics || !metrics.recentLogs.length) {
      return [];
    }

    // Group logs by hour
    const hourlyData = new Map<string, { success: number; failure: number; total: number }>();

    // Process logs (they're already sorted newest first from Redis)
    const logs = [...metrics.recentLogs].reverse(); // Reverse to show oldest first

    for (const log of logs) {
      const date = new Date(log.timestamp);
      // Round to the nearest hour
      date.setMinutes(0, 0, 0);
      const hourKey = date.toISOString();

      const existing = hourlyData.get(hourKey) || { success: 0, failure: 0, total: 0 };

      if (log.status === "success") {
        existing.success++;
      } else {
        existing.failure++;
      }
      existing.total++;

      hourlyData.set(hourKey, existing);
    }

    // Convert to array and format
    return Array.from(hourlyData.entries()).map(([timestamp, data]) => ({
      timestamp,
      time: new Date(timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
      }),
      Success: data.success,
      Failure: data.failure,
      Total: data.total,
    }));
  }, [metrics]);

  if (!metrics || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>No activity data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-muted-foreground">Sync activity will appear here over time</p>
        </CardContent>
      </Card>
    );
  }

  interface TooltipPayload {
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
  }) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid gap-2">
            <div className="text-xs text-muted-foreground">{label}</div>
            {payload.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
                <span className="text-xs font-bold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const timeWindowLabels: Record<"24h" | "7d" | "30d" | "90d", string> = {
    "24h": "Last 24 Hours",
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    "90d": "Last 90 Days",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Operations over time ({timeWindowLabels[timeWindow]})</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFailure" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
              tickMargin={10}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="Success"
              stroke="hsl(var(--chart-1))"
              fillOpacity={1}
              fill="url(#colorSuccess)"
              stackId="1"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Failure"
              stroke="hsl(var(--chart-3))"
              fillOpacity={1}
              fill="url(#colorFailure)"
              stackId="1"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

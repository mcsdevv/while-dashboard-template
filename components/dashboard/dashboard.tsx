"use client";

import { UserMenu } from "@/components/auth/user-menu";
import { LogsViewer } from "@/components/dashboard/logs-viewer";
import type { SyncMetrics } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/shared/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui";
import { Separator } from "@/shared/ui";
import { Skeleton } from "@/shared/ui";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Lazy load the chart component to code-split recharts (~40KB)
const ActivityTimelineChart = dynamic(
  () =>
    import("@/components/dashboard/activity-timeline-chart").then(
      (mod) => mod.ActivityTimelineChart,
    ),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    ),
  },
);

type TimeWindow = "24h" | "7d" | "30d" | "90d";

export function Dashboard() {
  const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
  const [status, setStatus] = useState<{
    healthy: boolean;
    message: string;
    lastSync: {
      notionToGcal: string | null;
      gcalToNotion: string | null;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("24h");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, statusRes] = await Promise.all([
          fetch(`/api/metrics?window=${timeWindow}`),
          fetch("/api/status"),
        ]);

        const [metricsData, statusData] = await Promise.all([metricsRes.json(), statusRes.json()]);

        setMetrics(metricsData);
        setStatus(statusData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [timeWindow]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const successRateNumeric = metrics
    ? metrics.totalSuccess + metrics.totalFailures > 0
      ? (metrics.totalSuccess / (metrics.totalSuccess + metrics.totalFailures)) * 100
      : null
    : null;

  const successRate = successRateNumeric !== null ? successRateNumeric.toFixed(1) : "N/A";

  const getHealthBadgeVariant = (): "success" | "warning" | "destructive" => {
    if (successRateNumeric === null) return "success";
    if (successRateNumeric > 99) return "success";
    if (successRateNumeric >= 90) return "warning";
    return "destructive";
  };

  const getSuccessRateColor = (): string => {
    if (successRateNumeric === null) return "";
    if (successRateNumeric > 99) return "text-foreground";
    if (successRateNumeric >= 90) return "text-muted-foreground";
    return "text-foreground/60";
  };

  const timeWindowLabels: Record<TimeWindow, string> = {
    "24h": "Last 24 Hours",
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    "90d": "Last 90 Days",
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">While</h1>
            <p className="text-muted-foreground mt-2">
              Real-time bidirectional synchronization dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={timeWindow}
              onValueChange={(value) => setTimeWindow(value as TimeWindow)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">{timeWindowLabels["24h"]}</SelectItem>
                <SelectItem value="7d">{timeWindowLabels["7d"]}</SelectItem>
                <SelectItem value="30d">{timeWindowLabels["30d"]}</SelectItem>
                <SelectItem value="90d">{timeWindowLabels["90d"]}</SelectItem>
              </SelectContent>
            </Select>
            <UserMenu />
          </div>
        </div>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>System Status</CardTitle>
              <Badge variant={getHealthBadgeVariant()}>
                {successRateNumeric !== null && successRateNumeric > 99
                  ? "Healthy"
                  : successRateNumeric !== null && successRateNumeric >= 90
                    ? "Degraded"
                    : "Issues Detected"}
              </Badge>
            </div>
            <CardDescription>{status?.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Last Sync: Notion → GCal</p>
                  <p className="text-lg font-medium">
                    {status?.lastSync.notionToGcal
                      ? formatDate(new Date(status.lastSync.notionToGcal))
                      : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Sync: GCal → Notion</p>
                  <p className="text-lg font-medium">
                    {status?.lastSync.gcalToNotion
                      ? formatDate(new Date(status.lastSync.gcalToNotion))
                      : "Never"}
                  </p>
                </div>
              </div>

              {!status?.healthy && metrics && (
                <div className="rounded-md border border-border bg-muted p-4 space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    {metrics.totalFailures} sync{" "}
                    {metrics.totalFailures === 1 ? "failure" : "failures"} detected
                  </p>
                  {metrics.recentLogs.filter((log) => log.status === "failure").slice(0, 3).length >
                    0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Recent errors:</p>
                      {metrics.recentLogs
                        .filter((log) => log.status === "failure")
                        .slice(0, 3)
                        .map((log) => (
                          <p key={log.id} className="text-xs text-destructive">
                            • {log.eventTitle}: {log.error || "Unknown error"}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-semibold ${getSuccessRateColor()}`}>{successRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Synced
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metrics?.totalSuccess || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Failures</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metrics?.totalFailures || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {(metrics?.totalSuccess || 0) + (metrics?.totalFailures || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <ActivityTimelineChart metrics={metrics} timeWindow={timeWindow} />

        <Separator />

        {/* Logs Viewer */}
        <LogsViewer logs={metrics?.recentLogs || []} />
      </div>
    </div>
  );
}

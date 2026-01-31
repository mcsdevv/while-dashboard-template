"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { AlertTriangle, Bell, Clock, RefreshCw } from "lucide-react";

interface WebhookMetrics {
  totalNotifications: number;
  totalRenewals: number;
  lastNotification: Date | string | null;
  lastRenewal: Date | string | null;
  errors: number;
  avgProcessingTime: number;
}

interface WebhookMetricsCardProps {
  metrics: WebhookMetrics;
}

function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "Never";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function MetricBox({
  icon: Icon,
  label,
  value,
  subValue,
  variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  variant?: "default" | "warning" | "error";
}) {
  const variantClasses = {
    default: "text-foreground",
    warning: "text-amber-600",
    error: "text-destructive",
  };

  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className={`text-2xl font-semibold ${variantClasses[variant]}`}>{value}</div>
      {subValue && <div className="text-xs text-muted-foreground">{subValue}</div>}
    </div>
  );
}

export function WebhookMetricsCard({ metrics }: WebhookMetricsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Webhook Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricBox
            icon={Bell}
            label="Notifications"
            value={metrics.totalNotifications}
            subValue={`Last: ${formatRelativeTime(metrics.lastNotification)}`}
          />
          <MetricBox
            icon={RefreshCw}
            label="Renewals"
            value={metrics.totalRenewals}
            subValue={`Last: ${formatRelativeTime(metrics.lastRenewal)}`}
          />
          <MetricBox
            icon={AlertTriangle}
            label="Errors"
            value={metrics.errors}
            variant={metrics.errors > 0 ? "error" : "default"}
          />
          <MetricBox
            icon={Clock}
            label="Avg Processing"
            value={`${Math.round(metrics.avgProcessingTime)}ms`}
            variant={metrics.avgProcessingTime > 1000 ? "warning" : "default"}
          />
        </div>
      </CardContent>
    </Card>
  );
}

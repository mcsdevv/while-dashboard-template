"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import Image from "next/image";

interface GoogleWebhookDebugStatus {
  configured: boolean;
  active: boolean;
  expired: boolean;
  needsRenewal: boolean;
  channelId?: string;
  resourceId?: string;
  calendarId?: string;
  expiresAt?: string;
  expiresInHours?: number;
  createdAt?: string;
  lastRenewedAt?: string;
  reason?: string;
}

interface GoogleWebhookCardProps {
  status: GoogleWebhookDebugStatus;
}

function formatDateTime(isoString: string | undefined): string {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusIcon({ status }: { status: GoogleWebhookDebugStatus }) {
  if (!status.configured) {
    return <XCircle className="h-5 w-5 text-muted-foreground" />;
  }
  if (status.expired) {
    return <XCircle className="h-5 w-5 text-destructive" />;
  }
  if (status.needsRenewal) {
    return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  }
  return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
}

function StatusBadge({ status }: { status: GoogleWebhookDebugStatus }) {
  if (!status.configured) {
    return <Badge variant="outline">Not Configured</Badge>;
  }
  if (status.expired) {
    return <Badge variant="destructive">Expired</Badge>;
  }
  if (status.needsRenewal) {
    return <Badge variant="secondary">Needs Renewal</Badge>;
  }
  return <Badge variant="success">Active</Badge>;
}

function DetailRow({
  label,
  value,
  mono = false,
}: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm text-right break-all ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export function GoogleWebhookCard({ status }: GoogleWebhookCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/icons/google-calendar.png"
              alt="Google Calendar"
              width={20}
              height={20}
              className="h-5 w-5"
            />
            <CardTitle className="text-base">Google Calendar</CardTitle>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <StatusIcon status={status} />
          <div>
            <p className="text-sm font-medium">
              {status.configured
                ? status.active
                  ? "Webhook Active"
                  : "Webhook Inactive"
                : "No Webhook Configured"}
            </p>
            {status.reason && <p className="text-xs text-muted-foreground">{status.reason}</p>}
          </div>
        </div>

        {status.configured && (
          <div className="space-y-0">
            <DetailRow label="Channel ID" value={status.channelId ?? "N/A"} mono />
            <DetailRow label="Resource ID" value={status.resourceId ?? "N/A"} mono />
            <DetailRow label="Calendar ID" value={status.calendarId ?? "N/A"} mono />
            <DetailRow
              label="Expires"
              value={
                status.expiresAt
                  ? `${formatDateTime(status.expiresAt)} (${status.expiresInHours}h remaining)`
                  : "N/A"
              }
            />
            <DetailRow label="Created" value={formatDateTime(status.createdAt)} />
            <DetailRow label="Last Renewed" value={formatDateTime(status.lastRenewedAt)} />
          </div>
        )}

        {status.configured && status.expiresInHours !== undefined && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {status.needsRenewal
                ? "Webhook will be auto-renewed soon"
                : "Auto-renews when less than 6h remaining"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

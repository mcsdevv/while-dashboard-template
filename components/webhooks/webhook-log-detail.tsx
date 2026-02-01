"use client";

import { GoogleCalendarIcon, NotionIcon } from "@/components/icons/brand-icons";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CollapsibleContent,
  CollapsibleTrigger,
  Skeleton,
} from "@/shared/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface WebhookLog {
  id: string;
  timestamp: Date | string;
  type: "notification" | "renewal" | "setup" | "error";
  source?: "notion" | "gcal";
  webhookEventType?: string;
  action?: "create" | "update" | "delete";
  eventTitle?: string;
  eventId?: string;
  resourceState?: string;
  channelId?: string;
  messageNumber?: number;
  status: "success" | "failure";
  error?: string;
  processingTime?: number;
}

interface WebhookLogDetailProps {
  logId: string;
}

function formatTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getTypeBadgeVariant(
  type: WebhookLog["type"],
): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "notification":
      return "default";
    case "renewal":
      return "secondary";
    case "setup":
      return "outline";
    case "error":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusBadgeVariant(status: WebhookLog["status"]): "success" | "destructive" {
  return status === "success" ? "success" : "destructive";
}

function getActionBadgeVariant(
  action: WebhookLog["action"],
): "success" | "default" | "destructive" {
  switch (action) {
    case "create":
      return "success";
    case "update":
      return "default";
    case "delete":
      return "destructive";
    default:
      return "default";
  }
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value ?? "-"}</span>
    </div>
  );
}

function CollapsibleSection({
  title,
  data,
  defaultOpen = false,
}: {
  title: string;
  data: unknown;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader className={isOpen ? "pb-0" : ""}>
        <CollapsibleTrigger
          isOpen={isOpen}
          onToggle={() => setIsOpen(!isOpen)}
          className="text-left w-full"
        >
          <CardTitle className="text-sm">{title}</CardTitle>
        </CollapsibleTrigger>
      </CardHeader>
      <CollapsibleContent isOpen={isOpen}>
        <CardContent className="pt-4">
          <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all bg-muted/50 p-4 rounded-lg">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </CollapsibleContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-48" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function WebhookLogDetail({ logId }: WebhookLogDetailProps) {
  const [log, setLog] = useState<WebhookLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchLog = useCallback(async () => {
    try {
      const response = await fetch("/api/webhooks/status");
      if (!response.ok) {
        throw new Error("Failed to fetch webhook status");
      }
      const result = await response.json();
      const foundLog = result.logs?.find((l: WebhookLog) => l.id === logId);

      if (foundLog) {
        setLog(foundLog);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load webhook event");
    } finally {
      setLoading(false);
    }
  }, [logId]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
        <Link
          href="/webhooks"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Webhooks
        </Link>
        <Card className="p-8 text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => fetchLog()}>Retry</Button>
        </Card>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
        <Link
          href="/webhooks"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Webhooks
        </Link>
        <Card className="p-8 text-center space-y-4">
          <h2 className="text-lg font-semibold">Event Not Found</h2>
          <p className="text-muted-foreground text-sm">
            This webhook event is no longer available. Events are retained for a limited time.
          </p>
          <Button variant="outline" asChild>
            <Link href="/webhooks">View Recent Events</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (!log) return null;

  const sourceLabel =
    log.source === "gcal" ? "Google Calendar" : log.source === "notion" ? "Notion" : "-";
  const hasChannelDetails =
    log.source === "gcal" &&
    (log.channelId || log.resourceState || log.messageNumber !== undefined);

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/webhooks"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Webhooks
        </Link>
        <Badge variant={getStatusBadgeVariant(log.status)} size="fixed">
          {log.status}
        </Badge>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Webhook Event Details</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Logged at {formatTimestamp(log.timestamp)}
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DetailRow
            label="Type"
            value={
              <Badge variant={getTypeBadgeVariant(log.type)} size="fixed">
                {log.type}
              </Badge>
            }
          />
          <DetailRow
            label="Source"
            value={
              log.source ? (
                <span className="inline-flex items-center gap-1.5">
                  {log.source === "gcal" ? <GoogleCalendarIcon /> : <NotionIcon />}
                  {sourceLabel}
                </span>
              ) : (
                "-"
              )
            }
          />
          <DetailRow
            label="Action"
            value={
              log.action ? (
                <Badge variant={getActionBadgeVariant(log.action)} size="fixed">
                  {log.action}
                </Badge>
              ) : (
                log.webhookEventType ?? "-"
              )
            }
          />
          <DetailRow
            label="Status"
            value={
              <Badge variant={getStatusBadgeVariant(log.status)} size="fixed">
                {log.status}
              </Badge>
            }
          />
          <DetailRow
            label="Processing Time"
            value={log.processingTime ? `${log.processingTime}ms` : "-"}
          />
        </CardContent>
      </Card>

      {/* Event Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Event Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DetailRow
            label="Title"
            value={log.eventTitle ? <span className="break-words">{log.eventTitle}</span> : "-"}
          />
          <DetailRow
            label="Event ID"
            value={
              log.eventId ? <span className="font-mono text-xs break-all">{log.eventId}</span> : "-"
            }
          />
          <DetailRow label="Webhook Type" value={log.webhookEventType ?? "-"} />
        </CardContent>
      </Card>

      {/* Channel Details (gcal only) */}
      {hasChannelDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Channel Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DetailRow
              label="Channel ID"
              value={
                log.channelId ? (
                  <span className="font-mono text-xs break-all">{log.channelId}</span>
                ) : (
                  "-"
                )
              }
            />
            <DetailRow label="Resource State" value={log.resourceState ?? "-"} />
            <DetailRow label="Message Number" value={log.messageNumber?.toString() ?? "-"} />
          </CardContent>
        </Card>
      )}

      {/* Error Details */}
      {log.error && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-sm text-destructive">Error Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-destructive/10 rounded-lg p-4">
              <pre className="text-sm font-mono whitespace-pre-wrap break-words text-destructive">
                {log.error}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Event Data */}
      <CollapsibleSection title="Raw Event Data" data={log} />
    </div>
  );
}

"use client";

import { GoogleCalendarIcon, NotionIcon } from "@/components/icons/brand-icons";
import type { SyncLog } from "@/lib/types";
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

interface SyncLogDetailProps {
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

function getOperationBadgeVariant(
  operation: SyncLog["operation"],
): "success" | "default" | "destructive" {
  switch (operation) {
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

function getStatusBadgeVariant(status: SyncLog["status"]): "success" | "destructive" {
  return status === "success" ? "success" : "destructive";
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value ?? "-"}</span>
    </div>
  );
}

function DirectionBadge({ direction }: { direction: SyncLog["direction"] }) {
  return (
    <Badge variant="outline" size="fixed" className="whitespace-nowrap">
      <span className="inline-flex items-center gap-1.5">
        {direction === "notion_to_gcal" ? (
          <>
            <NotionIcon />
            <span aria-hidden="true">→</span>
            <GoogleCalendarIcon />
            <span className="sr-only">Notion to Google Calendar</span>
          </>
        ) : (
          <>
            <GoogleCalendarIcon />
            <span aria-hidden="true">→</span>
            <NotionIcon />
            <span className="sr-only">Google Calendar to Notion</span>
          </>
        )}
      </span>
    </Badge>
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
  const handleToggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <Card>
      <CardHeader className={isOpen ? "pb-0" : ""}>
        <CollapsibleTrigger isOpen={isOpen} onToggle={handleToggle} className="text-left w-full">
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
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
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
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function SyncLogDetail({ logId }: SyncLogDetailProps) {
  const [log, setLog] = useState<SyncLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchLog = useCallback(async () => {
    try {
      const response = await fetch(`/api/activity/${logId}`);
      if (response.status === 404) {
        setNotFound(true);
        setError(null);
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch sync event");
      }
      const result = await response.json();
      setLog(result);
      setNotFound(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sync event");
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
      <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
        <Link
          href="/activity"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Activity
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
      <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
        <Link
          href="/activity"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Activity
        </Link>
        <Card className="p-8 text-center space-y-4">
          <h2 className="text-lg font-semibold">Event Not Found</h2>
          <p className="text-muted-foreground text-sm">
            This sync event is no longer available. Events are retained for a limited time.
          </p>
          <Button variant="outline" asChild>
            <Link href="/activity">View Recent Events</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (!log) return null;

  const directionLabel =
    log.direction === "notion_to_gcal" ? "Notion → Google Calendar" : "Google Calendar → Notion";

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/activity"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Activity
        </Link>
        <Badge variant={getStatusBadgeVariant(log.status)} size="fixed">
          {log.status}
        </Badge>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sync Event Details</h1>
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
          <DetailRow label="Direction" value={<DirectionBadge direction={log.direction} />} />
          <DetailRow
            label="Operation"
            value={
              <Badge variant={getOperationBadgeVariant(log.operation)} size="fixed">
                {log.operation}
              </Badge>
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
          {log.notionPageId && (
            <DetailRow
              label="Notion Page ID"
              value={<span className="font-mono text-xs break-all">{log.notionPageId}</span>}
            />
          )}
          {log.gcalEventId && (
            <DetailRow
              label="GCal Event ID"
              value={<span className="font-mono text-xs break-all">{log.gcalEventId}</span>}
            />
          )}
        </CardContent>
      </Card>

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
      <CollapsibleSection title="Raw Event Data" data={log.rawPayload ?? log} defaultOpen={false} />
    </div>
  );
}

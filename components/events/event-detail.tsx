"use client";

import { EventTimeline } from "@/components/events/event-timeline";
import { PropertyDiff } from "@/components/events/property-diff";
import { type PropertyChange, computeDiff } from "@/lib/events/diff";
import type { EventHistoryResponse } from "@/lib/types";
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
import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

interface EventDetailProps {
  eventId: string;
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
      <div className="grid gap-6 lg:grid-cols-2">
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
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function EventDetail({ eventId }: EventDetailProps) {
  const [data, setData] = useState<EventHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}`);
      if (response.status === 404) {
        setNotFound(true);
        setError(null);
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch event history");
      }
      const result: EventHistoryResponse = await response.json();
      setData(result);
      setNotFound(false);
      setError(null);

      // Select the most recent operation by default
      if (result.operations.length > 0) {
        setSelectedLogId(result.operations[result.operations.length - 1].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load event history");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate diff for selected operation
  const { selectedLog, previousLog, changes } = useMemo(() => {
    if (!data || !selectedLogId) {
      return { selectedLog: null, previousLog: null, changes: [] as PropertyChange[] };
    }

    const selectedIndex = data.operations.findIndex((op) => op.id === selectedLogId);
    if (selectedIndex === -1) {
      return { selectedLog: null, previousLog: null, changes: [] as PropertyChange[] };
    }

    const selected = data.operations[selectedIndex];
    const previous = selectedIndex > 0 ? data.operations[selectedIndex - 1] : null;

    // Compute diff if both have rawPayload
    let diffChanges: PropertyChange[] = [];
    if (selected.rawPayload) {
      diffChanges = computeDiff(previous?.rawPayload ?? null, selected.rawPayload);
    }

    return {
      selectedLog: selected,
      previousLog: previous,
      changes: diffChanges,
    };
  }, [data, selectedLogId]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Events
        </Link>
        <Card className="p-8 text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => fetchData()}>Retry</Button>
        </Card>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Events
        </Link>
        <Card className="p-8 text-center space-y-4">
          <h2 className="text-lg font-semibold">Event Not Found</h2>
          <p className="text-muted-foreground text-sm">
            This event is no longer available. Events are retained for a limited time.
          </p>
          <Button variant="outline" asChild>
            <Link href="/events">View Recent Events</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { event, operations } = data;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Events
        </Link>
        <Badge variant={event.latestStatus === "success" ? "success" : "destructive"} size="fixed">
          {event.latestStatus}
        </Badge>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight break-words">{event.eventTitle}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {event.operationCount} {event.operationCount === 1 ? "operation" : "operations"} recorded
        </p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Event Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DetailRow
            label="Event ID"
            value={<span className="font-mono text-xs break-all">{event.eventId}</span>}
          />
          <DetailRow label="Last Activity" value={formatTimestamp(event.latestTimestamp)} />
          <DetailRow
            label="Latest Operation"
            value={
              <Badge
                variant={
                  event.latestOperation === "create"
                    ? "success"
                    : event.latestOperation === "update"
                      ? "default"
                      : "destructive"
                }
                size="fixed"
              >
                {event.latestOperation}
              </Badge>
            }
          />
          {event.notionPageId && (
            <DetailRow
              label="Notion Page ID"
              value={<span className="font-mono text-xs break-all">{event.notionPageId}</span>}
            />
          )}
          {event.gcalEventId && (
            <DetailRow
              label="GCal Event ID"
              value={<span className="font-mono text-xs break-all">{event.gcalEventId}</span>}
            />
          )}
        </CardContent>
      </Card>

      {/* Time Travel Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              Event Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EventTimeline
              operations={operations}
              selectedId={selectedLogId}
              onSelect={setSelectedLogId}
            />
          </CardContent>
        </Card>

        {/* Property Diff */}
        <div className="space-y-4">
          {selectedLog ? (
            <>
              {selectedLog.rawPayload ? (
                <PropertyDiff changes={changes} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Changes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Change data unavailable for this operation
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Selected Operation Details */}
              <CollapsibleSection
                title="Selected Operation Data"
                data={selectedLog}
                defaultOpen={false}
              />
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Select an operation from the timeline to view changes
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

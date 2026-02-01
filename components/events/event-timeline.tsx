"use client";

import { GoogleCalendarIcon, NotionIcon } from "@/components/icons/brand-icons";
import type { SyncLog } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/shared/ui";
import { AlertCircle, CheckCircle2, Circle } from "lucide-react";

interface EventTimelineProps {
  operations: SyncLog[];
  selectedId: string | null;
  onSelect: (logId: string) => void;
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

function TimelineEntry({
  log,
  isSelected,
  isFirst,
  isLast,
  onSelect,
}: {
  log: SyncLog;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
}) {
  const isSuccess = log.status === "success";

  return (
    <button
      type="button"
      className={`relative flex gap-4 cursor-pointer group text-left w-full ${
        isSelected ? "bg-muted/50" : "hover:bg-muted/30"
      } rounded-lg p-3 -mx-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring`}
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        {/* Top line */}
        <div className={`w-0.5 h-3 ${isFirst ? "bg-transparent" : "bg-border"}`} />
        {/* Dot */}
        <div
          className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full ${
            isSelected
              ? "bg-primary text-primary-foreground"
              : isSuccess
                ? "bg-success/20 text-success"
                : "bg-destructive/20 text-destructive"
          }`}
        >
          {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        </div>
        {/* Bottom line */}
        <div className={`w-0.5 flex-1 ${isLast ? "bg-transparent" : "bg-border"}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge variant={getOperationBadgeVariant(log.operation)} size="fixed" className="text-xs">
            {log.operation}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <span className="inline-flex items-center gap-1">
              {log.direction === "notion_to_gcal" ? (
                <>
                  <NotionIcon />
                  <span aria-hidden="true">→</span>
                  <GoogleCalendarIcon />
                </>
              ) : (
                <>
                  <GoogleCalendarIcon />
                  <span aria-hidden="true">→</span>
                  <NotionIcon />
                </>
              )}
            </span>
          </Badge>
          <Badge variant={isSuccess ? "success" : "destructive"} size="fixed" className="text-xs">
            {log.status}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">{formatDate(new Date(log.timestamp))}</p>

        {log.error && <p className="text-xs text-destructive mt-1 truncate">{log.error}</p>}

        {log.processingTime && (
          <p className="text-xs text-muted-foreground mt-1">
            Processing time: {log.processingTime}ms
          </p>
        )}
      </div>
    </button>
  );
}

export function EventTimeline({ operations, selectedId, onSelect }: EventTimelineProps) {
  if (operations.length === 0) {
    return (
      <div className="text-center py-8">
        <Circle className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No operations found</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {operations.map((log, index) => (
        <TimelineEntry
          key={log.id}
          log={log}
          isSelected={selectedId === log.id}
          isFirst={index === 0}
          isLast={index === operations.length - 1}
          onSelect={() => onSelect(log.id)}
        />
      ))}
    </div>
  );
}

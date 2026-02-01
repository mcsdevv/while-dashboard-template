import { getSyncLogs } from "@/lib/sync/logger";
import type { SyncLog } from "@/lib/types";
import { type NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

interface EventSummary {
  eventId: string;
  eventTitle: string;
  latestTimestamp: Date | string;
  operationCount: number;
  latestOperation: SyncLog["operation"];
  latestStatus: SyncLog["status"];
  notionPageId?: string;
  gcalEventId?: string;
}

interface EventHistoryResponse {
  event: EventSummary;
  operations: SyncLog[];
}

/**
 * GET /api/events/[eventId]
 * Returns all sync operations for a specific event (identified by eventId)
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    const logs = await getSyncLogs(500);

    // Filter logs by eventId
    const eventLogs = logs.filter((log) => log.eventId === eventId);

    if (eventLogs.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Sort chronologically (oldest first for timeline)
    const sortedLogs = [...eventLogs].sort((a, b) => {
      const timeA =
        typeof a.timestamp === "string" ? new Date(a.timestamp).getTime() : a.timestamp.getTime();
      const timeB =
        typeof b.timestamp === "string" ? new Date(b.timestamp).getTime() : b.timestamp.getTime();
      return timeA - timeB;
    });

    // Get latest operation for summary
    const latest = sortedLogs[sortedLogs.length - 1];

    const response: EventHistoryResponse = {
      event: {
        eventId,
        eventTitle: latest.eventTitle,
        latestTimestamp: latest.timestamp,
        operationCount: sortedLogs.length,
        latestOperation: latest.operation,
        latestStatus: latest.status,
        notionPageId: latest.notionPageId,
        gcalEventId: latest.gcalEventId,
      },
      operations: sortedLogs,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching event history:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

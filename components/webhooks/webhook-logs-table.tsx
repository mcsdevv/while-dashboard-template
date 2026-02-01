"use client";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui";
import { useMemo, useState } from "react";

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

interface WebhookLogsTableProps {
  logs: WebhookLog[];
}

function formatTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return date.toLocaleString(undefined, {
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

export function WebhookLogsTable({ logs }: WebhookLogsTableProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (typeFilter !== "all" && log.type !== typeFilter) return false;
      if (sourceFilter !== "all" && log.source !== sourceFilter) return false;
      if (statusFilter !== "all" && log.status !== statusFilter) return false;
      return true;
    });
  }, [logs, typeFilter, sourceFilter, statusFilter]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-base">Recent Webhook Events</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
                <SelectItem value="renewal">Renewal</SelectItem>
                <SelectItem value="setup">Setup</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="gcal">Google Cal</SelectItem>
                <SelectItem value="notion">Notion</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {logs.length === 0
              ? "No webhook events recorded yet"
              : "No events match the current filters"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Timestamp</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[80px]">Source</TableHead>
                  <TableHead className="w-[80px]">Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-[80px]">Status</TableHead>
                  <TableHead className="w-[60px] text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.slice(0, 50).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(log.type)} size="fixed" className="text-xs">
                        {log.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{log.source ?? "-"}</TableCell>
                    <TableCell className="text-xs">
                      {log.action ?? log.webhookEventType ?? "-"}
                    </TableCell>
                    <TableCell
                      className="text-xs max-w-[200px] truncate"
                      title={log.eventTitle || log.error}
                    >
                      {log.eventTitle || log.error || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(log.status)} size="fixed" className="text-xs">
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono">
                      {log.processingTime ? `${log.processingTime}ms` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {filteredLogs.length > 50 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Showing 50 of {filteredLogs.length} events
          </p>
        )}
      </CardContent>
    </Card>
  );
}

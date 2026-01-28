"use client";

import type { SyncDirection, SyncLog, SyncOperation } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/shared/ui";
import { Button } from "@/shared/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { Input } from "@/shared/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui";
import { useMemo, useState } from "react";

interface LogsViewerProps {
  logs: SyncLog[];
}

const ROWS_PER_PAGE = 20;

export function LogsViewer({ logs }: LogsViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState<SyncDirection | "all">("all");
  const [operationFilter, setOperationFilter] = useState<SyncOperation | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"success" | "failure" | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and search logs
  const filteredLogs = useMemo(() => {
    // First, build a map of recent CREATE operations (within 60 seconds)
    const recentCreates = new Map<string, number>();
    for (const log of logs) {
      if (log.operation === "create" && log.status === "success") {
        const key = `${log.eventId}-${log.direction}`;
        const timestamp =
          typeof log.timestamp === "string"
            ? new Date(log.timestamp).getTime()
            : log.timestamp.getTime();
        recentCreates.set(key, timestamp);
      }
    }

    return logs.filter((log) => {
      // Hide linkage updates: UPDATE operations within 60 seconds of CREATE for same event+direction
      if (log.operation === "update" && log.status === "success") {
        const key = `${log.eventId}-${log.direction}`;
        const createTime = recentCreates.get(key);
        if (createTime) {
          const updateTime =
            typeof log.timestamp === "string"
              ? new Date(log.timestamp).getTime()
              : log.timestamp.getTime();
          const timeDiff = updateTime - createTime;
          // If update happened within 60 seconds after create, it's a linkage update
          if (timeDiff > 0 && timeDiff <= 60000) {
            return false; // Hide this log
          }
        }
      }

      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        log.eventTitle.toLowerCase().includes(searchLower) ||
        log.error?.toLowerCase().includes(searchLower);

      // Direction filter
      const matchesDirection = directionFilter === "all" || log.direction === directionFilter;

      // Operation filter
      const matchesOperation = operationFilter === "all" || log.operation === operationFilter;

      // Status filter
      const matchesStatus = statusFilter === "all" || log.status === statusFilter;

      return matchesSearch && matchesDirection && matchesOperation && matchesStatus;
    });
  }, [logs, searchQuery, directionFilter, operationFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleDirectionChange = (value: string) => {
    setDirectionFilter(value as SyncDirection | "all");
    setCurrentPage(1);
  };

  const handleOperationChange = (value: string) => {
    setOperationFilter(value as SyncOperation | "all");
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as "success" | "failure" | "all");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Logs</CardTitle>
          <CardDescription>No sync operations recorded yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Sync logs will appear here once operations begin
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync Logs</CardTitle>
        <CardDescription>
          {filteredLogs.length} {filteredLogs.length === 1 ? "entry" : "entries"} found
          {filteredLogs.length !== logs.length && ` (filtered from ${logs.length} total)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Search by event or error…"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full"
          />

          <Select value={directionFilter} onValueChange={handleDirectionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Direction…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              <SelectItem value="notion_to_gcal">Notion → GCal</SelectItem>
              <SelectItem value="gcal_to_notion">GCal → Notion</SelectItem>
            </SelectContent>
          </Select>

          <Select value={operationFilter} onValueChange={handleOperationChange}>
            <SelectTrigger>
              <SelectValue placeholder="Operation…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Operations</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Status…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failure">Failure</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No logs match your filters</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="bg-muted">Timestamp</TableHead>
                    <TableHead className="bg-muted">Direction</TableHead>
                    <TableHead className="bg-muted">Operation</TableHead>
                    <TableHead className="bg-muted">Event</TableHead>
                    <TableHead className="bg-muted">Event ID</TableHead>
                    <TableHead className="bg-muted">Status</TableHead>
                    <TableHead className="bg-muted">Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(new Date(log.timestamp))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {log.direction === "notion_to_gcal" ? "Notion → GCal" : "GCal → Notion"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.operation === "create"
                              ? "success"
                              : log.operation === "update"
                                ? "default"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {log.operation.charAt(0).toUpperCase() + log.operation.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {log.eventTitle}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono max-w-[150px] truncate">
                        {log.eventId}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={log.status === "success" ? "success" : "destructive"}
                          className="text-xs"
                        >
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {log.error && (
                          <span className="text-xs text-destructive truncate block">
                            {log.error}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of{" "}
                  {filteredLogs.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

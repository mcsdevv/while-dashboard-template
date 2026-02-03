"use client";

import { useToast } from "@/lib/toast";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { Calendar, Clock, History, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface HistoricalSyncProgress {
  status: "idle" | "running" | "completed" | "failed" | "cancelled";
  total: number;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  days: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

interface HistoricalSyncPreview {
  status: "preview";
  days: number;
  total: number;
  newEvents: number;
  alreadySynced: number;
  recurringInstances: number;
}

const TIME_PRESETS = [
  { value: "7", label: "Last week", days: 7 },
  { value: "30", label: "Last month", days: 30 },
  { value: "90", label: "Last 3 months", days: 90 },
  { value: "180", label: "Last 6 months", days: 180 },
  { value: "365", label: "Last year", days: 365 },
] as const;

export function HistoricalSync() {
  const { addToast } = useToast();
  const [progress, setProgress] = useState<HistoricalSyncProgress | null>(null);
  const [preview, setPreview] = useState<HistoricalSyncPreview | null>(null);
  const [selectedDays, setSelectedDays] = useState<string>("30");
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // Fetch current progress
  const fetchProgress = useCallback(async () => {
    try {
      const response = await fetch("/api/sync/historical");
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      }
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    }
  }, []);

  // Poll for progress while running
  useEffect(() => {
    fetchProgress();

    const interval = setInterval(() => {
      if (progress?.status === "running") {
        fetchProgress();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchProgress, progress?.status]);

  // Fetch preview when days change
  const handlePreview = async () => {
    setPreviewing(true);
    setPreview(null);

    try {
      const response = await fetch("/api/sync/historical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: Number.parseInt(selectedDays), preview: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch preview");
      }

      const data = await response.json();
      setPreview(data);
    } catch (error) {
      addToast({
        title: "Preview failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setPreviewing(false);
    }
  };

  // Start sync
  const handleStartSync = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/sync/historical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: Number.parseInt(selectedDays) }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start sync");
      }

      addToast({
        title: "Historical sync started",
        description: `Syncing events from the last ${selectedDays} days`,
        variant: "success",
      });

      setPreview(null);
      fetchProgress();
    } catch (error) {
      addToast({
        title: "Failed to start sync",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cancel sync
  const handleCancel = async () => {
    try {
      const response = await fetch("/api/sync/historical", {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel sync");
      }

      addToast({
        title: "Cancelling sync",
        description: "Sync will stop after the current batch",
        variant: "default",
      });

      fetchProgress();
    } catch (error) {
      addToast({
        title: "Failed to cancel",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Reset after completion
  const handleReset = async () => {
    try {
      await fetch("/api/sync/historical", { method: "DELETE" });
      setProgress(null);
      setPreview(null);
    } catch (error) {
      console.error("Failed to reset:", error);
    }
  };

  const isRunning = progress?.status === "running";
  const isCompleted = progress?.status === "completed";
  const isFailed = progress?.status === "failed";
  const isCancelled = progress?.status === "cancelled";
  const hasResult = isCompleted || isFailed || isCancelled;

  const progressPercent = progress?.total
    ? Math.round((progress.processed / progress.total) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Sync Past Events
        </CardTitle>
        <CardDescription>
          Import existing Google Calendar events to Notion from a specified time period
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Running State */}
        {isRunning && progress && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Syncing past events...
              </span>
              <span className="text-muted-foreground">
                {progress.processed}/{progress.total}
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Created: {progress.created} | Updated: {progress.updated} | Errors:{" "}
                {progress.errors}
              </span>
              <Button variant="ghost" size="sm" onClick={handleCancel} className="h-6 px-2">
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Result State */}
        {hasResult && progress && (
          <div className="space-y-4">
            <div
              className={`rounded-lg p-4 ${
                isCompleted
                  ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900"
                  : isCancelled
                    ? "bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900"
                    : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"
              }`}
            >
              <h4
                className={`text-sm font-medium ${
                  isCompleted
                    ? "text-green-800 dark:text-green-200"
                    : isCancelled
                      ? "text-yellow-800 dark:text-yellow-200"
                      : "text-red-800 dark:text-red-200"
                }`}
              >
                {isCompleted ? "Sync Completed" : isCancelled ? "Sync Cancelled" : "Sync Failed"}
              </h4>
              {isFailed && progress.error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{progress.error}</p>
              )}
              <div className="mt-2 text-xs text-muted-foreground grid grid-cols-2 gap-1">
                <span>Created: {progress.created}</span>
                <span>Updated: {progress.updated}</span>
                <span>Skipped: {progress.skipped}</span>
                <span>Errors: {progress.errors}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
              Start New Sync
            </Button>
          </div>
        )}

        {/* Selection State */}
        {!isRunning && !hasResult && (
          <>
            <div className="space-y-3">
              <p className="text-sm font-medium">Select time range</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TIME_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={selectedDays === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedDays(preset.value);
                      setPreview(null);
                    }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview Section */}
            {preview && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Found {preview.total} events to sync
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• {preview.newEvents} new events</li>
                  <li>• {preview.alreadySynced} already synced (will update)</li>
                  <li>• {preview.recurringInstances} recurring instances</li>
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={previewing}
                className="flex-1"
              >
                {previewing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading preview...
                  </>
                ) : (
                  "Preview"
                )}
              </Button>
              <Button onClick={handleStartSync} disabled={loading || !preview} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start Sync"
                )}
              </Button>
            </div>

            {!preview && (
              <p className="text-xs text-muted-foreground text-center">
                Click Preview to see how many events will be synced
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

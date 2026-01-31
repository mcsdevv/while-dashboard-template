"use client";

import { getTokenHealth } from "@/lib/settings/token-health";
import { Badge } from "@/shared/ui";
import { Button } from "@/shared/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { useState } from "react";

interface GoogleStatus {
  isConfigured: boolean;
  isConnected: boolean;
  calendarId: string | null;
  calendarName: string | null;
  connectedAt: string | null;
  oauthAppPublished?: boolean;
}

interface NotionStatus {
  databaseId: string | null;
  databaseName: string | null;
  isConnected: boolean;
}

interface ConnectionStatusProps {
  google: GoogleStatus | null;
  notion: NotionStatus | null;
}

interface TestResult {
  service: "Google Calendar" | "Notion";
  success: boolean;
  message: string;
  details?: string;
}

export function ConnectionStatus({ google, notion }: ConnectionStatusProps) {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch("/api/settings/test", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to test connections");
      }

      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to test connections");
    } finally {
      setTesting(false);
    }
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "Unknown";
    return new Date(isoString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection Status</CardTitle>
        <CardDescription>Overview of your Google Calendar and Notion connections</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Google Status */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Google Calendar</span>
              <Badge
                variant={google?.isConnected ? "success" : "destructive"}
                className="whitespace-nowrap"
              >
                {google?.isConnected ? "Connected" : "Not Connected"}
              </Badge>
            </div>
            {google?.isConnected && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Calendar:{" "}
                  {google.calendarName ||
                    (google.calendarId === "primary"
                      ? "Primary Calendar"
                      : google.calendarId || "Not selected")}
                </p>
                <p>Connected: {formatDate(google.connectedAt)}</p>
                {/* Token health indicator - only show if app not published */}
                {(() => {
                  if (google.oauthAppPublished) {
                    return (
                      <div className="mt-2 rounded px-2 py-1 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <svg
                          aria-hidden="true"
                          className="inline h-3 w-3 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Published app (no token expiry)
                      </div>
                    );
                  }
                  const health = getTokenHealth(google.connectedAt);
                  if (!health) return null;
                  return (
                    <div
                      className={`mt-2 rounded px-2 py-1 text-xs ${
                        health.status === "critical"
                          ? "bg-destructive/10 text-destructive"
                          : health.status === "warning"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-foreground/5 text-muted-foreground"
                      }`}
                    >
                      {health.status === "critical" && (
                        <svg
                          aria-hidden="true"
                          className="inline h-3 w-3 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {health.status === "warning" && (
                        <svg
                          aria-hidden="true"
                          className="inline h-3 w-3 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {health.message}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Notion Status */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Notion</span>
              <Badge
                variant={notion?.isConnected ? "success" : "destructive"}
                className="whitespace-nowrap"
              >
                {notion?.isConnected ? "Connected" : "Not Connected"}
              </Badge>
            </div>
            {notion?.isConnected && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Database: {notion.databaseName || "Not selected"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.service}
                className={`rounded-lg border p-3 ${
                  result.success
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 text-emerald-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 text-destructive"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span
                    className={`text-sm font-medium ${
                      result.success
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive"
                    }`}
                  >
                    {result.service}: {result.message}
                  </span>
                </div>
                {result.details && (
                  <p className="mt-1 text-xs text-muted-foreground">{result.details}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <Button onClick={handleTest} disabled={testing} variant="outline" className="w-full">
          {testing ? "Testing..." : "Test Connections"}
        </Button>
      </CardContent>
    </Card>
  );
}

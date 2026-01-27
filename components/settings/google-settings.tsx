"use client";

import { Badge } from "@/shared/ui";
import { Button } from "@/shared/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { getTokenHealth } from "@/lib/settings/token-health";
import { useRouter } from "next/navigation";

interface GoogleSettingsProps {
  settings: {
    isConfigured: boolean;
    isConnected: boolean;
    calendarId: string | null;
    calendarName: string | null;
    connectedAt: string | null;
  } | null;
}

export function GoogleSettings({ settings }: GoogleSettingsProps) {
  const router = useRouter();

  const handleReconnect = () => {
    router.push("/setup?step=google");
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

  // Display calendar name, falling back to ID if name not available
  const getCalendarDisplay = () => {
    if (settings?.calendarName) {
      return settings.calendarName;
    }
    if (settings?.calendarId) {
      // Show abbreviated ID if no name
      return settings.calendarId === "primary"
        ? "Primary Calendar"
        : settings.calendarId.split("@")[0] || settings.calendarId;
    }
    return "Not selected";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Google Calendar</CardTitle>
            <CardDescription>Manage your Google Calendar connection</CardDescription>
          </div>
          <Badge variant={settings?.isConnected ? "success" : "destructive"}>
            {settings?.isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings?.isConnected ? (
          <>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                <span className="text-muted-foreground">Calendar</span>
                <span className="truncate font-medium">{getCalendarDisplay()}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                <span className="text-muted-foreground">Connected</span>
                <span>{formatDate(settings.connectedAt)}</span>
              </div>
            </div>

            {/* Token health indicator */}
            {(() => {
              const health = getTokenHealth(settings.connectedAt);
              if (!health || health.status === "healthy") return null;
              return (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    health.status === "critical"
                      ? "bg-destructive/10 border border-destructive/30"
                      : "bg-amber-500/10 border border-amber-500/30"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {health.status === "critical" ? (
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4 text-destructive shrink-0 mt-0.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
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
                    <div>
                      <p
                        className={
                          health.status === "critical"
                            ? "text-destructive font-medium"
                            : "text-amber-700 dark:text-amber-400 font-medium"
                        }
                      >
                        {health.message}
                      </p>
                      {health.action && (
                        <p
                          className={
                            health.status === "critical"
                              ? "text-destructive/80 text-xs mt-1"
                              : "text-amber-600 dark:text-amber-500 text-xs mt-1"
                          }
                        >
                          {health.action}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="pt-2">
              <Button variant="outline" onClick={handleReconnect} className="w-full">
                Reconnect Google Calendar
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Google Calendar is not connected. Complete the setup to start syncing events.
            </p>
            <Button onClick={handleReconnect}>Connect Google Calendar</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

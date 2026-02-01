"use client";

import { GoogleCalendarIcon } from "@/components/icons/brand-icons";
import { getTokenHealth, shouldPromptPublishedStatus } from "@/lib/settings/token-health";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface GoogleSettingsProps {
  settings: {
    isConfigured: boolean;
    isConnected: boolean;
    calendarId: string | null;
    calendarName: string | null;
    connectedAt: string | null;
    oauthAppPublished?: boolean;
  } | null;
  onSettingsChange?: () => void;
}

export function GoogleSettings({ settings, onSettingsChange }: GoogleSettingsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [localPublished, setLocalPublished] = useState(settings?.oauthAppPublished ?? false);

  const handleReconnect = () => {
    router.push("/setup?step=google");
  };

  const handleTogglePublished = async (value: boolean) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oauthAppPublished: value }),
      });
      if (response.ok) {
        setLocalPublished(value);
        onSettingsChange?.();
      }
    } catch (error) {
      console.error("Failed to update setting:", error);
    } finally {
      setIsUpdating(false);
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

  const getCalendarDisplay = () => {
    if (settings?.calendarName) {
      return settings.calendarName;
    }
    if (settings?.calendarId) {
      return settings.calendarId === "primary"
        ? "Primary Calendar"
        : settings.calendarId.split("@")[0] || settings.calendarId;
    }
    return "Not selected";
  };

  const showAutoDetectPrompt =
    !localPublished && shouldPromptPublishedStatus(settings?.connectedAt ?? null);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GoogleCalendarIcon size="lg" />
            <div>
              <CardTitle>Google Calendar</CardTitle>
              <CardDescription>Manage your Google Calendar connection</CardDescription>
            </div>
          </div>
          <Badge variant={settings?.isConnected ? "success" : "destructive"}>
            {settings?.isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {settings?.isConnected ? (
          <div className="flex flex-col h-full space-y-4">
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

            {/* Auto-detect prompt: token survived 8+ days */}
            {showAutoDetectPrompt && (
              <div className="rounded-lg p-3 text-sm bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-start gap-2">
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                      Token still working after 7 days
                    </p>
                    <p className="text-emerald-600 dark:text-emerald-500 text-xs mt-1">
                      Your OAuth app appears to be published. Confirm to hide token expiration
                      warnings.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleTogglePublished(true)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Saving..." : "Yes, my app is published"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Token health indicator - only show if app not published */}
            {!localPublished &&
              (() => {
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

            {/* Published app toggle */}
            <div className="flex items-center justify-between py-2 border-t">
              <div className="space-y-0.5">
                <label htmlFor="oauth-published" className="text-sm font-medium cursor-pointer">
                  OAuth app is published
                </label>
                <p className="text-xs text-muted-foreground">
                  Hides 7-day token expiration warnings
                </p>
              </div>
              <button
                id="oauth-published"
                type="button"
                role="switch"
                aria-checked={localPublished}
                disabled={isUpdating}
                onClick={() => handleTogglePublished(!localPublished)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  localPublished ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                    localPublished ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="mt-auto pt-4">
              <Button variant="outline" onClick={handleReconnect} className="w-full">
                Reconnect Google Calendar
              </Button>
            </div>
          </div>
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

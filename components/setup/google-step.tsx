"use client";

import { Button, ConnectionStatusCard } from "@/shared/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui";
import { signIn } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { CopyValue } from "./copy-value";

interface GoogleStepProps {
  status?: {
    configured: boolean;
    connected: boolean;
    calendarSelected: boolean;
    calendarName?: string | null;
  };
  onBack: () => void;
  onNext: () => void;
}

interface Calendar {
  id: string;
  name: string;
  primary: boolean;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: string;
}

// Helper to generate actionable error messages
function getActionableErrorMessage(error: string, redirectUri: string): string {
  const lowerError = error.toLowerCase();

  if (lowerError.includes("not configured") || lowerError.includes("client_id")) {
    return "Missing Google credentials. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel → Settings → Environment Variables, then redeploy.";
  }

  if (lowerError.includes("redirect") || lowerError.includes("redirect_uri_mismatch")) {
    return `Redirect URI mismatch. In Google Cloud Console → Credentials → Your OAuth Client, add this exact URI: ${redirectUri}`;
  }

  if (lowerError.includes("access_denied") || lowerError.includes("blocked")) {
    return "Access blocked. In Google Cloud Console → OAuth consent screen → Test users, add your email address.";
  }

  if (lowerError.includes("invalid_client")) {
    return `Invalid credentials. Double-check your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. Make sure the credentials are for "Web application" type, not "Desktop".`;
  }

  if (lowerError.includes("disabled") || lowerError.includes("calendar api")) {
    return `Calendar API not enabled. Go to Google Cloud Console → APIs & Services → Library → Search "Google Calendar API" → Enable.`;
  }

  // Generic fallback with common causes
  return `OAuth failed. Common causes: (1) Redirect URI doesn't match exactly: ${redirectUri}, (2) Email not added as test user, (3) Calendar API not enabled.`;
}

export function GoogleStep({ status, onBack, onNext }: GoogleStepProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>("");
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const isConnected = status?.connected;
  const isConfigured = status?.configured;

  // Generate redirect URI from current host
  const redirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth/callback/google`
      : "https://your-app.vercel.app/api/auth/callback/google";

  // Validate credentials on mount if configured
  useEffect(() => {
    if (isConfigured && !isConnected && !validation) {
      validateCredentials();
    }
  }, [isConfigured, isConnected, validation]);

  const validateCredentials = async () => {
    setValidating(true);
    try {
      const response = await fetch("/api/setup/google/validate");
      const data = await response.json();
      setValidation(data);
      if (!data.valid && data.error) {
        setError(getActionableErrorMessage(data.error, redirectUri));
      }
    } catch {
      // Don't block on validation failure, just proceed
      setValidation({ valid: true });
    } finally {
      setValidating(false);
    }
  };

  const handleSignIn = async () => {
    setConnecting(true);
    setError(null);

    try {
      // Trigger NextAuth sign-in with Google
      // This will redirect to Google, get consent, store refresh token, and redirect back
      await signIn("google", { callbackUrl: "/setup/3" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign in";
      setError(getActionableErrorMessage(errorMessage, redirectUri));
      setConnecting(false);
    }
  };

  const loadCalendars = useCallback(async () => {
    setLoadingCalendars(true);
    try {
      const response = await fetch("/api/setup/google/calendars");
      if (response.ok) {
        const data = await response.json();
        setCalendars(data.calendars);
        if (data.selectedCalendarId) {
          setSelectedCalendar(data.selectedCalendarId);
        }
      }
    } catch (err) {
      console.error("Failed to load calendars:", err);
    } finally {
      setLoadingCalendars(false);
    }
  }, []);

  const handleSelectCalendar = async (calendarId: string) => {
    setSelectedCalendar(calendarId);
    setError(null);
    setNotice(null);
    try {
      // Find calendar name for storage
      const selectedCal = calendars.find((cal) => cal.id === calendarId);
      const calendarName = selectedCal?.name || "";

      const response = await fetch("/api/setup/google/calendars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId, calendarName }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to select calendar");
      }

      setNotice(data?.warning ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select calendar");
    }
  };

  // Load calendars if already connected
  useEffect(() => {
    if (isConnected && calendars.length === 0 && !loadingCalendars) {
      loadCalendars();
    }
  }, [isConnected, calendars.length, loadingCalendars, loadCalendars]);

  // Show configuration error if credentials are missing
  const showConfigError = !isConfigured && !isConnected;

  return (
    <div className="space-y-6">
      {!isConnected ? (
        <>
          {showConfigError ? (
            // Credentials not configured - show setup instructions
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set up Google OAuth to enable calendar synchronization. Follow the steps below to
                configure your credentials.
              </p>

              {/* Google OAuth Configuration Values */}
              <div className="rounded-lg border p-3 space-y-3">
                <h3 className="font-medium">Configure Google OAuth</h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      1. Go to{" "}
                      <a
                        href="https://console.cloud.google.com/auth/clients/create"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Create an OAuth 2.0 Client ID
                      </a>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      2. Add this <strong>Authorized redirect URI</strong>:
                    </p>
                    <CopyValue value={redirectUri} />
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      3. Add these <strong>OAuth Scopes</strong> to your consent screen:
                    </p>
                    <CopyValue value="openid email profile https://www.googleapis.com/auth/calendar" />
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      4. Copy your Client ID and Secret, then add them to Vercel:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-1">
                      <li>
                        <code className="bg-muted px-1 rounded">GOOGLE_CLIENT_ID</code>
                      </li>
                      <li>
                        <code className="bg-muted px-1 rounded">GOOGLE_CLIENT_SECRET</code>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      5. Redeploy your app, then return here to sign in
                    </p>
                  </div>
                </div>

                <a
                  href="https://while.so/docs/setup/google"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline inline-block"
                >
                  Full Setup Guide →
                </a>
              </div>
            </div>
          ) : (
            // Credentials configured - show sign in
            <div className="space-y-4">
              {/* Redirect URI setup instructions */}
              <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5 text-blue-600 shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      Before signing in
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Add this redirect URI to your Google Cloud OAuth credentials:
                    </p>
                    <CopyValue value={redirectUri} />
                    <ol className="text-sm text-blue-600 dark:text-blue-300 list-decimal list-inside space-y-1">
                      <li>
                        Go to{" "}
                        <a
                          href="https://console.cloud.google.com/apis/credentials"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium"
                        >
                          Google Cloud Console → Credentials
                        </a>
                      </li>
                      <li>Click your OAuth 2.0 Client ID</li>
                      <li>Add the URI above under "Authorized redirect URIs"</li>
                      <li>Click Save</li>
                    </ol>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Sign in with your Google account to grant calendar access. This allows While to sync
                events between Notion and Google Calendar.
              </p>

              {validating && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground flex items-center gap-2">
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="2" className="opacity-25" />
                    <path
                      d="M4 12a8 8 0 018-8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="opacity-75"
                    />
                  </svg>
                  Validating credentials...
                </div>
              )}

              {validation && !validation.valid && (
                <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 space-y-2">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-500">
                    Credential issue detected
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
                </div>
              )}

              {/* Google OAuth Configuration Values */}
              <div className="rounded-lg border p-3 space-y-3">
                <h3 className="font-medium">Configure Google OAuth</h3>
                <p className="text-sm text-muted-foreground">
                  Add these values to your Google Cloud OAuth credentials before signing in:
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      1. Go to{" "}
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Google Cloud Credentials
                      </a>{" "}
                      and edit your OAuth 2.0 Client
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      2. Add this <strong>Authorized redirect URI</strong>:
                    </p>
                    <CopyValue value={redirectUri} />
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      3. Add these <strong>OAuth Scopes</strong> to your consent screen:
                    </p>
                    <CopyValue value="openid email profile https://www.googleapis.com/auth/calendar" />
                  </div>
                </div>

                <a
                  href="https://while.so/docs/setup/google"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline inline-block"
                >
                  Full Setup Guide →
                </a>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <p className="font-medium mb-2">What permissions are requested:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>View and edit your Google Calendar events</li>
                  <li>Access your email address for authentication</li>
                </ul>
              </div>
            </div>
          )}

          {error && !showConfigError && validation?.valid !== false && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm space-y-2">
              <p className="font-medium text-destructive">Connection failed</p>
              <p className="text-destructive/90">{error}</p>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={handleSignIn} disabled={connecting || showConfigError || validating}>
              {connecting ? "Connecting..." : validating ? "Validating..." : "Sign in with Google"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <ConnectionStatusCard
            title="Google Calendar"
            subtitle={
              calendars.find((c) => c.id === selectedCalendar)?.name ||
              status?.calendarName ||
              "Loading calendar..."
            }
            subtitleLabel="Calendar"
          />

          <div className="space-y-2">
            <span id="calendar-label" className="text-sm font-medium">
              Select Calendar to Sync
            </span>
            <p className="text-sm text-muted-foreground">
              Choose which Google Calendar to sync with your Notion database.
            </p>
            <Select
              value={selectedCalendar}
              onValueChange={handleSelectCalendar}
              aria-labelledby="calendar-label"
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingCalendars ? "Loading calendars…" : "Select a calendar…"}
                />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((cal) => (
                  <SelectItem key={cal.id} value={cal.id}>
                    {cal.name} {cal.primary && "(Primary)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          {notice && (
            <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
              {notice}
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={onNext} disabled={!selectedCalendar}>
              Continue
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

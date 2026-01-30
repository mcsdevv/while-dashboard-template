"use client";

import { Button } from "@/shared/ui";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusCard } from "./status-card";
import { StepHeader } from "./step-header";

interface SyncStepProps {
  onBack: () => void;
  onNext: () => void;
}

type ProviderStatus = "idle" | "pending" | "success" | "warning" | "error";

interface ProviderState {
  status: ProviderStatus;
  message?: string;
  details?: string;
  verificationRequired?: boolean;
  instructions?: string[];
}

interface SyncStatusResponse {
  google: {
    active: boolean;
    reason?: string;
    expiresAt?: string;
    expiresInHours?: number;
  };
  notion: {
    active: boolean;
    verified: boolean;
    reason?: string;
    state?: string;
    subscriptionId?: string;
  };
}

interface SyncSetupResponse {
  google: {
    success: boolean;
    message?: string;
    error?: string;
    expiresAt?: string;
    expiresInHours?: number;
  };
  notion: {
    success: boolean;
    message?: string;
    error?: string;
    verificationRequired?: boolean;
    verificationInstructions?: string[];
  };
}

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function formatExpiration(expiresAt?: string, expiresInHours?: number): string | undefined {
  if (!expiresAt) return undefined;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return undefined;
  const safeHours =
    typeof expiresInHours === "number" ? Math.max(0, Math.round(expiresInHours)) : undefined;
  const hours = typeof safeHours === "number" ? ` (~${safeHours}h)` : "";
  return `Expires ${date.toLocaleString()}${hours}`;
}

export function SyncStep({ onBack, onNext }: SyncStepProps) {
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleStatus, setGoogleStatus] = useState<ProviderState>({ status: "idle" });
  const [notionStatus, setNotionStatus] = useState<ProviderState>({ status: "idle" });

  useEffect(() => {
    setIsLocalhost(typeof window !== "undefined" && LOCAL_HOSTNAMES.has(window.location.hostname));
  }, []);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    setError(null);
    const onLocalhost =
      typeof window !== "undefined" && LOCAL_HOSTNAMES.has(window.location.hostname);
    try {
      const response = await fetch("/api/setup/sync");
      if (!response.ok) {
        throw new Error("Failed to check sync status");
      }
      const data = (await response.json()) as SyncStatusResponse;

      if (data.google.active) {
        setGoogleStatus(
          onLocalhost
            ? {
                status: "warning",
                message: "Google Calendar webhook active",
                details: "Messages won't be received on localhost",
              }
            : {
                status: "success",
                message: "Google Calendar webhook active",
                details: formatExpiration(data.google.expiresAt, data.google.expiresInHours),
              },
        );
      } else {
        setGoogleStatus({
          status: data.google.reason ? "error" : "idle",
          message: data.google.reason ? "Google Calendar webhook inactive" : undefined,
          details: data.google.reason,
        });
      }

      const verificationRequired =
        data.notion.state === "verification_required" ||
        (data.notion.reason?.toLowerCase().includes("verification") ?? false);

      if (data.notion.active && data.notion.verified) {
        setNotionStatus(
          onLocalhost
            ? {
                status: "warning",
                message: "Notion webhook active",
                details: "Messages won't be received on localhost",
              }
            : {
                status: "success",
                message: "Notion webhook active",
                details: data.notion.state ? `State: ${data.notion.state}` : undefined,
              },
        );
      } else if (verificationRequired) {
        const verificationUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/api/webhooks/notion`
            : "your deployed webhook URL";
        setNotionStatus({
          status: "warning",
          message: "Notion verification required",
          details: data.notion.reason,
          verificationRequired: true,
          instructions: [
            "Go to https://www.notion.so/my-integrations",
            "Open your integration and select the Webhooks tab",
            `Verify the webhook for URL: ${verificationUrl}`,
          ],
        });
      } else if (data.notion.reason) {
        setNotionStatus({
          status: "error",
          message: "Notion webhook inactive",
          details: data.notion.reason,
        });
      } else {
        setNotionStatus({ status: "idle" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sync status");
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleEnableSync = async () => {
    setSyncing(true);
    setError(null);
    setGoogleStatus({ status: "pending", message: "Setting up Google Calendar webhook..." });
    setNotionStatus({ status: "pending", message: "Setting up Notion webhook..." });

    try {
      const response = await fetch("/api/setup/sync", { method: "POST" });
      const data = (await response.json()) as SyncSetupResponse;

      if (!response.ok) {
        throw new Error(data?.notion?.error || data?.google?.error || "Failed to enable sync");
      }

      setGoogleStatus(
        data.google.success
          ? {
              status: "success",
              message: data.google.message || "Google Calendar webhook active",
              details: formatExpiration(data.google.expiresAt, data.google.expiresInHours),
            }
          : {
              status: "error",
              message: "Google Calendar webhook failed",
              details: data.google.error,
            },
      );

      if (data.notion.success) {
        setNotionStatus({
          status: data.notion.verificationRequired ? "warning" : "success",
          message: data.notion.message || "Notion webhook active",
          details: data.notion.verificationRequired
            ? "Verify the webhook in Notion before testing."
            : undefined,
          verificationRequired: data.notion.verificationRequired,
          instructions: data.notion.verificationInstructions,
        });
      } else {
        setNotionStatus({
          status: "error",
          message: "Notion webhook failed",
          details: data.notion.error,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable sync");
      setGoogleStatus({ status: "error", message: "Google Calendar webhook failed" });
      setNotionStatus({ status: "error", message: "Notion webhook failed" });
    } finally {
      setSyncing(false);
    }
  };

  const canContinue = useMemo(() => {
    const googleReady = googleStatus.status === "success";
    const notionReady = notionStatus.status === "success" || notionStatus.status === "warning";
    return googleReady && notionReady;
  }, [googleStatus.status, notionStatus.status]);

  const showStatuses =
    loadingStatus === false && (googleStatus.status !== "idle" || notionStatus.status !== "idle");

  const showVerificationInstructions =
    notionStatus.status === "warning" && notionStatus.instructions?.length;

  return (
    <div className="space-y-6">
      <StepHeader
        title="Sync"
        description="Enable real-time synchronization between your services."
      />

      {isLocalhost && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Webhooks won&apos;t work on localhost
              </p>
              <p className="text-amber-700/90 dark:text-amber-300">
                Deploy to a public URL before enabling real-time sync. You can skip this step for
                now and return after deployment.
              </p>
              <p className="text-amber-700/90 dark:text-amber-300">
                Alternatively, a tunneling service (ngrok, cloudflared, etc.) can expose your local
                server to the internet. No implementation guidance is provided.
              </p>
            </div>
          </div>
        </div>
      )}

      {loadingStatus && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Checking current sync status...
        </div>
      )}

      {showStatuses && (
        <div className="space-y-4">
          <StatusCard
            icon={
              googleStatus.status === "pending"
                ? Loader2
                : googleStatus.status === "warning"
                  ? AlertTriangle
                  : googleStatus.status === "success"
                    ? CheckCircle2
                    : XCircle
            }
            title="Google Calendar"
            message={
              googleStatus.status === "pending"
                ? "Setting up webhook"
                : googleStatus.message || "Not configured"
            }
            details={googleStatus.details}
            variant={
              googleStatus.status === "success"
                ? "success"
                : googleStatus.status === "warning"
                  ? "warning"
                  : googleStatus.status === "pending"
                  ? "warning"
                  : "error"
            }
            iconClassName={googleStatus.status === "pending" ? "animate-spin" : undefined}
            className={googleStatus.status === "pending" ? "animate-pulse" : undefined}
          />
          <StatusCard
            icon={
              notionStatus.status === "pending"
                ? Loader2
                : notionStatus.status === "warning"
                  ? AlertTriangle
                  : notionStatus.status === "success"
                    ? CheckCircle2
                    : XCircle
            }
            title="Notion"
            message={
              notionStatus.status === "pending"
                ? "Setting up webhook"
                : notionStatus.message || "Not configured"
            }
            details={notionStatus.details}
            variant={
              notionStatus.status === "success"
                ? "success"
                : notionStatus.status === "warning"
                  ? "warning"
                  : notionStatus.status === "pending"
                    ? "warning"
                    : "error"
            }
            iconClassName={notionStatus.status === "pending" ? "animate-spin" : undefined}
            className={notionStatus.status === "pending" ? "animate-pulse" : undefined}
          />
        </div>
      )}

      {showVerificationInstructions && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400 space-y-2">
          <p className="font-medium">Finish Notion verification</p>
          <ol className="list-decimal list-inside space-y-1">
            {notionStatus.instructions?.map((instruction) => (
              <li key={instruction}>{instruction}</li>
            ))}
          </ol>
        </div>
      )}

      {error && (
        <div className="border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-3">
          {isLocalhost && (
            <Button variant="outline" onClick={onNext}>
              Skip for now
            </Button>
          )}
          {!isLocalhost && (
            <Button variant="outline" onClick={handleEnableSync} disabled={syncing}>
              {syncing ? "Enabling..." : "Enable Real-Time Sync"}
            </Button>
          )}
          <Button onClick={onNext} disabled={isLocalhost || !canContinue}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

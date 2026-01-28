"use client";

import { Button } from "@/shared/ui";
import { useCallback, useEffect, useState } from "react";

interface StorageStepProps {
  onBack: () => void;
  onNext: () => void;
}

interface StorageStatus {
  configured: boolean;
}

export function StorageStep({ onBack, onNext }: StorageStepProps) {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [checking, setChecking] = useState(true);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/setup/storage/status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to check storage status:", error);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const isConfigured = status?.configured ?? false;

  return (
    <div className="space-y-6">
      {checking ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Checking storage configuration...</span>
        </div>
      ) : isConfigured ? (
        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-4">
          <div className="flex items-center gap-2 text-foreground">
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Storage configured</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Redis is connected and ready to store your settings.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-destructive">
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Storage not configured</span>
            </div>
            <p className="mt-1 text-sm text-destructive/80">
              While needs a Redis database to store your settings securely.
            </p>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-medium">Setup via Vercel</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">1.</span>
                <span>
                  Go to your{" "}
                  <a
                    href="https://vercel.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Vercel Dashboard
                  </a>{" "}
                  and select your project
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">2.</span>
                <span>
                  Navigate to{" "}
                  <span className="font-medium text-foreground">Storage</span> tab and click{" "}
                  <span className="font-medium text-foreground">Create Database</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">3.</span>
                <span>
                  Select{" "}
                  <span className="font-medium text-foreground">Upstash for Redis</span> and follow the
                  prompts (the free tier works great)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">4.</span>
                <span>
                  Connect the database to your project (this adds the environment variables
                  automatically)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">5.</span>
                <span>
                  <span className="font-medium text-foreground">Redeploy</span> your project for the
                  changes to take effect
                </span>
              </li>
            </ol>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p className="font-medium">Required environment variables:</p>
            <ul className="mt-1 font-mono text-xs space-y-0.5">
              <li>KV_REST_API_URL</li>
              <li>KV_REST_API_TOKEN</li>
            </ul>
          </div>
        </>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        {isConfigured ? (
          <Button onClick={onNext}>Continue</Button>
        ) : (
          <Button onClick={checkStatus} disabled={checking}>
            {checking ? "Checking..." : "Check Again"}
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/shared/ui";
import { useState } from "react";
import { CopyValue } from "./copy-value";

interface WelcomeStepProps {
  onNext: () => void;
}

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar",
].join(" ");

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const [showHelper, setShowHelper] = useState(false);

  // Generate redirect URI from current host
  const redirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth/callback/google`
      : "https://your-app.vercel.app/api/auth/callback/google";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-muted-foreground">
          This wizard will help you connect your Google Calendar and Notion database for
          bidirectional synchronization.
        </p>

        {/* 7-day token warning */}
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 space-y-2">
          <div className="flex items-start gap-2">
            <svg
              aria-hidden="true"
              className="h-5 w-5 text-amber-600 shrink-0 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-500">
                Token expiration notice
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                OAuth tokens expire every 7 days in "Testing" mode. You'll need to re-authenticate
                weekly unless you{" "}
                <a
                  href="https://while.so/docs/setup/google#step-5-publish-app-optional"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  publish your OAuth app
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="font-medium">Prerequisites</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              <span>
                A Google Cloud project with Calendar API enabled and OAuth 2.0 credentials.{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Create credentials
                </a>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              <span>
                A Notion integration with access to your calendar database.{" "}
                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Create integration
                </a>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              <span>
                Share your Notion database with the integration (click "..." menu in the database,
                then "Connections").
              </span>
            </li>
          </ul>
        </div>

        {/* Setup helper - expandable */}
        <div className="rounded-lg border p-4 space-y-3">
          <button
            type="button"
            onClick={() => setShowHelper(!showHelper)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-medium">Google OAuth Configuration Values</h3>
            <svg
              aria-hidden="true"
              className={`h-5 w-5 text-muted-foreground transition-transform ${showHelper ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showHelper && (
            <div className="space-y-4 pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Copy these values when configuring your Google Cloud OAuth credentials:
              </p>

              <CopyValue label="Authorized Redirect URI" value={redirectUri} />

              <CopyValue label="OAuth Scopes (for consent screen)" value={GOOGLE_SCOPES} />

              <div className="flex gap-2 pt-2">
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                >
                  Google Cloud Credentials
                </a>
                <span className="text-muted-foreground">|</span>
                <a
                  href="https://while.so/docs/setup/google"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                >
                  Full Setup Guide
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <h3 className="font-medium">What you'll configure</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>- Google Calendar OAuth connection</li>
            <li>- Notion API integration</li>
            <li>- Field mapping between Notion properties and Google Calendar</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext}>Get Started</Button>
      </div>
    </div>
  );
}

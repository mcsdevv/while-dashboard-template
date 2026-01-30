"use client";

import { Button } from "@/shared/ui";
import { StepHeader } from "./step-header";

interface WelcomeStepProps {
  onNext: () => void;
  oauthAppPublished?: boolean;
}

export function WelcomeStep({ onNext, oauthAppPublished }: WelcomeStepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <StepHeader
          title="Welcome"
          description="This wizard will help you connect your Google Calendar and Notion database for bidirectional synchronization."
        />

        {/* 7-day token warning - hidden when OAuth app is published */}
        {!oauthAppPublished && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
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
              <p className="text-sm text-amber-600 dark:text-amber-400">
                <span className="font-medium text-amber-700 dark:text-amber-500">
                  Token expiration notice:
                </span>{" "}
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
        )}

        <div className="rounded-lg border p-3 space-y-2">
          <h3 className="font-medium">Prerequisites</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              <span>
                A Google Cloud project with Calendar API enabled and OAuth 2.0 credentials.{" "}
                <a
                  href="https://console.cloud.google.com/auth/clients/create"
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
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext}>Get Started</Button>
      </div>
    </div>
  );
}

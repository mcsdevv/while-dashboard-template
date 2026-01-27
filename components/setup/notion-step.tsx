"use client";

import { Button } from "@/shared/ui";
import { Input } from "@/shared/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { TemplateLink } from "./template-link";

interface NotionStepProps {
  status?: {
    configured: boolean;
    databaseSelected: boolean;
    databaseName: string | null;
  };
  onBack: () => void;
  onNext: () => void;
}

interface Database {
  id: string;
  name: string;
}

interface ValidationStatus {
  status: "idle" | "validating" | "valid" | "invalid" | "warning";
  message?: string;
  databaseCount?: number;
  integrationName?: string;
  workspaceName?: string;
  errors?: string[];
}

export function NotionStep({ status, onBack, onNext }: NotionStepProps) {
  const [apiToken, setApiToken] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [validated, setValidated] = useState(status?.configured || false);
  const [selectingDb, setSelectingDb] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>({ status: "idle" });

  // Debounce timer ref
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validationRequestId = useRef(0);
  const validationAbortController = useRef<AbortController | null>(null);

  // Debounced validation function
  const validateTokenDebounced = useCallback((token: string) => {
    // Clear any existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    validationRequestId.current += 1;
    const requestId = validationRequestId.current;

    // Reset status if token is too short
    if (token.length < 10) {
      if (validationAbortController.current) {
        validationAbortController.current.abort();
        validationAbortController.current = null;
      }
      setValidationStatus({ status: "idle" });
      return;
    }

    // Set validating status
    setValidationStatus({ status: "validating" });

    // Debounce the API call
    debounceTimer.current = setTimeout(async () => {
      if (validationAbortController.current) {
        validationAbortController.current.abort();
      }
      const controller = new AbortController();
      validationAbortController.current = controller;

      try {
        const response = await fetch("/api/setup/notion/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ apiToken: token }),
        });

        const data = await response.json();
        if (validationRequestId.current !== requestId) {
          return;
        }

        if (data.valid) {
          if (data.databaseCount === 0) {
            setValidationStatus({
              status: "warning",
              message: "Token valid but no databases shared",
              databaseCount: 0,
              integrationName: data.integrationName,
              workspaceName: data.workspaceName,
              errors: data.errors,
            });
          } else {
            setValidationStatus({
              status: "valid",
              message: `${data.databaseCount} database${data.databaseCount === 1 ? "" : "s"} accessible`,
              databaseCount: data.databaseCount,
              integrationName: data.integrationName,
              workspaceName: data.workspaceName,
            });
          }
        } else {
          setValidationStatus({
            status: "invalid",
            message: data.errors?.[0] || "Invalid token",
            errors: data.errors,
          });
        }
      } catch (err) {
        if (validationRequestId.current !== requestId) {
          return;
        }
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setValidationStatus({
          status: "invalid",
          message: "Failed to validate token",
        });
      }
    }, 500);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      validationRequestId.current += 1;
      if (validationAbortController.current) {
        validationAbortController.current.abort();
      }
    };
  }, []);

  // Handle token input change
  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = e.target.value;
    setApiToken(newToken);
    validateTokenDebounced(newToken);
  };

  const handleValidateToken = async () => {
    if (!apiToken) {
      setError("Please enter your Notion API token");
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const response = await fetch("/api/setup/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to validate token");
      }

      setDatabases(data.databases);
      setValidated(true);

      if (data.databases.length === 0) {
        setError(
          "No databases found. Make sure you've shared at least one database with your integration.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate token");
    } finally {
      setValidating(false);
    }
  };

  const handleSelectDatabase = async (databaseId: string) => {
    setSelectedDatabase(databaseId);
    setSelectingDb(true);
    setError(null);

    try {
      const response = await fetch("/api/setup/notion/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to select database");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select database");
      setSelectedDatabase("");
    } finally {
      setSelectingDb(false);
    }
  };

  // Render validation status indicator
  const renderValidationStatus = () => {
    if (validationStatus.status === "idle") return null;

    const statusConfig = {
      validating: {
        icon: (
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
        ),
        color: "text-muted-foreground",
        bg: "bg-muted/50",
      },
      valid: {
        icon: (
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        ),
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-50 dark:bg-green-950/30",
      },
      invalid: {
        icon: (
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        ),
        color: "text-destructive",
        bg: "bg-destructive/10",
      },
      warning: {
        icon: (
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        ),
        color: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-50 dark:bg-yellow-950/30",
      },
    };

    const config = statusConfig[validationStatus.status];

    return (
      <div className={`mt-2 flex items-start gap-2 rounded-md p-2 text-sm ${config.bg}`}>
        <span className={config.color}>{config.icon}</span>
        <div className="flex-1">
          <span className={config.color}>
            {validationStatus.status === "validating" ? "Validating..." : validationStatus.message}
          </span>
          {validationStatus.integrationName &&
            (validationStatus.status === "valid" || validationStatus.status === "warning") && (
            <span className="ml-1 text-muted-foreground">
              ({validationStatus.integrationName}
              {validationStatus.workspaceName && ` in ${validationStatus.workspaceName}`})
            </span>
          )}
          {validationStatus.status === "warning" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Share a database with your integration:{" "}
              <a
                href="https://www.notion.so/help/add-and-manage-connections-with-the-api#add-connections-to-pages"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Learn how
              </a>
            </p>
          )}
          {validationStatus.status === "invalid" && (
            <p className="mt-1 text-xs text-muted-foreground">
              <a
                href="https://www.notion.so/my-integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Create or check your integration
              </a>
            </p>
          )}
        </div>
      </div>
    );
  };

  // If already configured with a database, show success state
  if (status?.databaseSelected && status?.databaseName) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-4">
          <div className="flex items-center gap-2 text-foreground">
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Notion connected</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Database: {status.databaseName}</p>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext}>Continue</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!validated ? (
        <>
          {/* Template recommendation */}
          <TemplateLink />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">
                or connect your existing database
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="apiToken" className="text-sm font-medium">
                Notion API Token
              </label>
              <Input
                id="apiToken"
                type="password"
                placeholder="secret_xxx..."
                value={apiToken}
                onChange={handleTokenChange}
              />
              {renderValidationStatus()}
              <p className="text-xs text-muted-foreground">
                Get your token from{" "}
                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Notion Integrations
                </a>
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <p className="font-medium">Quick setup:</p>
              <ol className="mt-1 list-inside list-decimal space-y-1 text-xs">
                <li>
                  <a
                    href="https://www.notion.so/my-integrations/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Create a new integration
                  </a>
                </li>
                <li>Copy the "Internal Integration Secret"</li>
                <li>Share your database with the integration (... menu → Connections)</li>
              </ol>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button
              onClick={handleValidateToken}
              disabled={validating || !apiToken || validationStatus.status === "invalid"}
            >
              {validating ? "Validating..." : "Continue"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-4">
            <div className="flex items-center gap-2 text-foreground">
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Token validated</span>
            </div>
          </div>

          <div className="space-y-2">
            <span id="database-label" className="text-sm font-medium">
              Select Database
            </span>
            <Select
              value={selectedDatabase}
              onValueChange={handleSelectDatabase}
              disabled={selectingDb}
              aria-labelledby="database-label"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a database" />
              </SelectTrigger>
              <SelectContent>
                {databases.map((db) => (
                  <SelectItem key={db.id} value={db.id}>
                    {db.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {databases.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No databases found. Make sure you've shared at least one database with your
                integration.
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={onNext} disabled={!selectedDatabase || selectingDb}>
              {selectingDb ? "Saving..." : "Continue"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

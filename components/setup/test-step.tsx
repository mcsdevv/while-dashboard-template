"use client";

import { Button } from "@/shared/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TestStepProps {
  onBack: () => void;
  setupComplete: boolean;
}

interface TestResult {
  service: string;
  success: boolean;
  message: string;
  details?: string;
}

export function TestStep({ onBack, setupComplete }: TestStepProps) {
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [allPassed, setAllPassed] = useState(setupComplete);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch("/api/setup/test", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to test connections");
      }

      setResults(data.results);
      setAllPassed(data.allPassed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to test connections");
    } finally {
      setTesting(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push("/");
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Test your connections to make sure everything is configured correctly.
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => (
            <div
              key={result.service}
              className={`rounded-lg border p-4 ${
                result.success
                  ? "border-foreground/10 bg-foreground/5"
                  : "border-foreground/20 bg-foreground/5"
              }`}
            >
              <div className="flex items-center gap-2">
                {result.success ? (
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5 text-foreground"
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
                    className="h-5 w-5 text-muted-foreground"
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
                  className={`font-medium ${
                    result.success ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {result.service}: {result.message}
                </span>
              </div>
              {result.details && (
                <p className="mt-1 text-sm text-muted-foreground">{result.details}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {allPassed && (
        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-4">
          <div className="flex items-center gap-2 text-foreground">
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Setup Complete!</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Your calendar sync is ready to use.</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleTest} disabled={testing} variant="outline">
            {testing ? "Testing..." : "Test Connections"}
          </Button>
          {allPassed && <Button onClick={handleGoToDashboard}>Go to Dashboard</Button>}
        </div>
      </div>
    </div>
  );
}

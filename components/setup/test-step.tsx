"use client";

import { useToast } from "@/lib/toast";
import { Button } from "@/shared/ui";
import { CheckCircle2, PartyPopper, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusCard } from "./status-card";
import { StepHeader } from "./step-header";

interface TestStepProps {
  onBack: () => void;
  setupComplete: boolean;
  onConfetti?: () => void;
}

interface TestResult {
  service: string;
  success: boolean;
  message: string;
  details?: string;
}

export function TestStep({ onBack, onConfetti }: TestStepProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [allPassed, setAllPassed] = useState(false);
  const [hasTested, setHasTested] = useState(false);

  // Auto-run tests on mount
  useEffect(() => {
    let cancelled = false;

    const runInitialTest = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/setup/test", { method: "POST" });
        if (cancelled) return;

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to test connections");
        }

        setResults(data.results);
        setAllPassed(data.allPassed);
        setHasTested(true);

        if (data.allPassed) {
          onConfetti?.();
        }
      } catch (err) {
        if (cancelled) return;
        addToast({
          title: "Connection test failed",
          description: err instanceof Error ? err.message : "Failed to test connections",
          variant: "destructive",
        });
        setHasTested(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    runInitialTest();
    return () => {
      cancelled = true;
    };
  }, [addToast, onConfetti]);

  const handleTest = async () => {
    setTesting(true);
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
      setHasTested(true);

      if (data.allPassed) {
        onConfetti?.();
      }
    } catch (err) {
      addToast({
        title: "Connection test failed",
        description: err instanceof Error ? err.message : "Failed to test connections",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push("/");
  };

  return (
    <div className="space-y-4">
      <StepHeader
        title="Test"
        description="Test the connections to ensure everything is working correctly."
      />

      {/* Loading indicator */}
      {loading && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Testing connections...
        </div>
      )}

      {/* Service status cards */}
      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((result) => (
            <StatusCard
              key={result.service}
              icon={result.success ? CheckCircle2 : XCircle}
              title={result.service}
              message={result.message}
              details={result.details}
              variant={result.success ? "success" : "error"}
            />
          ))}
        </div>
      )}

      {/* Setup Complete card - only show after tests pass */}
      {hasTested && allPassed && (
        <StatusCard
          icon={PartyPopper}
          title="Setup Complete!"
          message="Your calendar sync is ready to use. Events will now sync between Google Calendar and Notion"
          variant="success"
        />
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-3">
          <Button onClick={handleTest} disabled={testing || loading} variant="outline">
            {testing ? "Testing..." : "Test Connections"}
          </Button>
          <Button
            onClick={handleGoToDashboard}
            disabled={!allPassed || loading}
            title={!allPassed && !loading ? "All tests must pass before continuing" : undefined}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

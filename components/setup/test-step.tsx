"use client";

import { Button } from "@/shared/ui";
import { CheckCircle2, PartyPopper, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export function TestStep({ onBack, setupComplete, onConfetti }: TestStepProps) {
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

      if (data.allPassed) {
        onConfetti?.();
      }
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
    <div className="space-y-4">
      <StepHeader
        title="Test"
        description="Test the connections to ensure everything is working correctly."
      />
      {/* Service status cards */}
      {results.length > 0 && (
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

      {/* Setup Complete card - uses same StatusCard for consistency */}
      {allPassed && (
        <StatusCard
          icon={PartyPopper}
          title="Setup Complete!"
          message="Your calendar sync is ready to use. Events will now sync between Google Calendar and Notion"
          variant="success"
        />
      )}

      {/* Error display */}
      {error && (
        <div className="border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-3">
          <Button onClick={handleTest} disabled={testing} variant="outline">
            {testing ? "Testing..." : "Test Connections"}
          </Button>
          {allPassed && <Button onClick={handleGoToDashboard}>Go to Dashboard</Button>}
        </div>
      </div>
    </div>
  );
}

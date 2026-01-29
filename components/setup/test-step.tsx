"use client";

import { Button } from "@/shared/ui";
import { CheckCircle2, PartyPopper, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";

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

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
}

export function TestStep({ onBack, setupComplete }: TestStepProps) {
  const router = useRouter();
  const { width, height } = useWindowSize();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [allPassed, setAllPassed] = useState(setupComplete);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti when allPassed becomes true
  useEffect(() => {
    if (allPassed) {
      setShowConfetti(true);
      // Stop confetti after 5 seconds
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [allPassed]);

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
    <>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 100 }}
        />
      )}

      <div className="space-y-5">
        {/* Service status cards */}
        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={result.service}
                className={`
                  rounded-lg border p-4 transition-all duration-300
                  ${result.success
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                  }
                `}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
                      <XCircle className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <span className={`font-medium ${result.success ? "text-foreground" : "text-muted-foreground"}`}>
                      {result.service}
                    </span>
                    <span className="text-muted-foreground">: {result.message}</span>
                  </div>
                </div>
                {result.details && (
                  <p className="mt-2 pl-11 text-sm text-muted-foreground">{result.details}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Setup Complete celebration card */}
        {allPassed && (
          <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-6">
            {/* Subtle glow effect */}
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                <PartyPopper className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">Setup Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  Your calendar sync is ready to use. Events will now sync between Google Calendar and Notion.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
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
            {allPassed && (
              <Button onClick={handleGoToDashboard}>
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

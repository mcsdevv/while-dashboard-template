"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { SkeletonSetupWizard } from "@/shared/ui";
import { useCallback, useEffect, useState } from "react";
import { FieldMappingStep } from "./field-mapping-step";
import { GoogleStep } from "./google-step";
import { NotionStep } from "./notion-step";
import { TestStep } from "./test-step";
import { WelcomeStep } from "./welcome-step";

interface SetupStatus {
  setupComplete: boolean;
  google: {
    configured: boolean;
    connected: boolean;
    calendarSelected: boolean;
  };
  notion: {
    configured: boolean;
    databaseSelected: boolean;
    databaseName: string | null;
  };
  fieldMapping: {
    configured: boolean;
  };
}

const STEPS = [
  { id: 1, name: "Welcome", description: "Get started" },
  { id: 2, name: "Google", description: "Connect calendar" },
  { id: 3, name: "Notion", description: "Connect database" },
  { id: 4, name: "Field Mapping", description: "Map properties" },
  { id: 5, name: "Test", description: "Verify setup" },
] as const;

export function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/setup/status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Check URL params for OAuth callback results
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "connected") {
      setCurrentStep(3); // Move to Notion step
      // Clean URL
      window.history.replaceState({}, "", "/setup");
      fetchStatus();
    } else if (params.get("error")) {
      // Handle error (could show toast)
      console.error("OAuth error:", params.get("error"));
      window.history.replaceState({}, "", "/setup");
    }
  }, [fetchStatus]);

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 5) {
      setCurrentStep(step);
    }
  };

  const handleStepComplete = () => {
    fetchStatus();
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  if (loading) {
    return <SkeletonSetupWizard />;
  }

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      {/* Progress indicator */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <li key={step.id} className="relative flex-1">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => goToStep(step.id)}
                  disabled={step.id > currentStep + 1}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
                    step.id === currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.id < currentStep
                        ? "bg-primary/20 text-primary hover:bg-primary/30"
                        : "bg-muted text-muted-foreground",
                    step.id <= currentStep + 1 && "cursor-pointer",
                  )}
                >
                  {step.id < currentStep ? (
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    step.id
                  )}
                </button>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    step.id === currentStep ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {step.name}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[calc(50%+24px)] top-5 h-0.5 w-[calc(100%-48px)]",
                    step.id < currentStep ? "bg-primary/50" : "bg-muted",
                  )}
                />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].name}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && <WelcomeStep onNext={handleStepComplete} />}
          {currentStep === 2 && (
            <GoogleStep
              status={status?.google}
              onBack={() => goToStep(1)}
              onNext={handleStepComplete}
            />
          )}
          {currentStep === 3 && (
            <NotionStep
              status={status?.notion}
              onBack={() => goToStep(2)}
              onNext={handleStepComplete}
            />
          )}
          {currentStep === 4 && (
            <FieldMappingStep onBack={() => goToStep(3)} onNext={handleStepComplete} />
          )}
          {currentStep === 5 && (
            <TestStep onBack={() => goToStep(4)} setupComplete={status?.setupComplete || false} />
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => goToStep(currentStep - 1)}
          disabled={currentStep === 1}
        >
          Back
        </Button>
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {STEPS.length}
        </div>
      </div>
    </div>
  );
}

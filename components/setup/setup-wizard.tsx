"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SkeletonSetupWizard,
} from "@/shared/ui";
import { Calendar, Check, Database, GitBranch, Sparkles, TestTube } from "lucide-react";
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
  { id: 1, name: "Welcome", description: "Get started with While", icon: Sparkles },
  { id: 2, name: "Google", description: "Connect your calendar", icon: Calendar },
  { id: 3, name: "Notion", description: "Connect your database", icon: Database },
  { id: 4, name: "Mapping", description: "Map your properties", icon: GitBranch },
  { id: 5, name: "Test", description: "Verify everything works", icon: TestTube },
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

  const currentStepData = STEPS[currentStep - 1];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Progress bar */}
      <div className="bg-muted h-1 overflow-hidden">
        <div
          className="h-full bg-foreground transition-all duration-300 ease-out"
          style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Stepper */}
      <nav aria-label="Progress" className="flex justify-center">
        <ol className="flex items-center gap-2 sm:gap-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isComplete = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isDisabled = step.id > currentStep + 1;

            return (
              <li key={step.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => goToStep(step.id)}
                  disabled={isDisabled}
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border transition-colors",
                    isCurrent && "bg-foreground text-background border-foreground",
                    isComplete && "bg-muted border-border",
                    !isCurrent && !isComplete && "bg-background border-border opacity-50",
                    !isDisabled && "hover:bg-muted cursor-pointer",
                    isDisabled && "cursor-not-allowed",
                  )}
                  aria-label={`Step ${step.id}: ${step.name}`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isComplete ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-6 sm:w-10 h-px mx-1 transition-colors",
                      isComplete ? "bg-foreground/30" : "bg-border",
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step labels (desktop only) */}
      <div className="hidden sm:flex justify-center -mt-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <span
                className={cn(
                  "w-10 sm:w-12 text-center text-xs font-medium transition-colors",
                  step.id === currentStep ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.name}
              </span>
              {index < STEPS.length - 1 && <div className="w-6 sm:w-10 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <Card className="animate-in slide-in-from-bottom duration-300">
        <CardHeader className="pb-4">
          <CardTitle>{currentStepData.name}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
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

      {/* Step counter */}
      <p className="text-center text-sm text-muted-foreground">
        Step {currentStep} of {STEPS.length}
      </p>
    </div>
  );
}

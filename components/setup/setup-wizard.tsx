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
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FieldMappingStep } from "./field-mapping-step";
import { GoogleStep } from "./google-step";
import { NotionStep } from "./notion-step";
import { TestStep } from "./test-step";
import { WelcomeStep } from "./welcome-step";

interface SetupStatus {
  setupComplete: boolean;
  storage?: {
    configured: boolean;
  };
  google: {
    configured: boolean;
    connected: boolean;
    calendarSelected: boolean;
    oauthAppPublished?: boolean;
  };
  notion: {
    configured: boolean;
    databaseSelected: boolean;
    databaseName: string | null;
    hasEnvToken?: boolean;
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

interface SetupWizardProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
}

export function SetupWizard({ currentStep }: SetupWizardProps) {
  const router = useRouter();
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

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 5) {
      router.push(`/setup/${step}`);
    }
  };

  const handleStepComplete = () => {
    fetchStatus();
    if (currentStep < 5) {
      router.push(`/setup/${currentStep + 1}`);
    }
  };

  if (loading) {
    return <SkeletonSetupWizard />;
  }

  const currentStepData = STEPS[currentStep - 1];
  const storageConfigured = status?.storage?.configured ?? true;
  const showStorageWarning = !storageConfigured;

  return (
    <div className="flex flex-col min-h-full animate-in fade-in duration-300">
      {/* Fixed navigation wrapper */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-background pt-8 pb-4 space-y-6">
        {/* Progress bar */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-muted h-1 overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
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
                      <Check aria-hidden="true" className="w-5 h-5" />
                    ) : (
                      <Icon aria-hidden="true" className="w-5 h-5" />
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
      </div>

      {/* Spacer for fixed nav - approximately 140px on desktop, 120px on mobile */}
      <div className="h-[120px] sm:h-[140px]" />

      {/* Scrollable content */}
      <div className="flex-1 space-y-6">
        {showStorageWarning && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
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
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  Storage not configured
                </p>
                <p className="text-amber-700/90 dark:text-amber-300">
                  While needs Upstash KV to save your settings. Redeploy using the Vercel deploy
                  button to provision storage. Until then, changes won&apos;t persist.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Step content */}
        <Card className="animate-in slide-in-from-bottom duration-300">
          <CardHeader className="pb-4">
            <CardTitle>{currentStepData.name}</CardTitle>
            <CardDescription>{currentStepData.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <WelcomeStep
                onNext={handleStepComplete}
                oauthAppPublished={status?.google?.oauthAppPublished}
              />
            )}
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
    </div>
  );
}

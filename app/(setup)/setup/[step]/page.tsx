import { SetupWizard } from "@/components/setup";
import { getSettings, isSetupComplete } from "@/lib/settings";
import type { AppSettings } from "@/lib/settings";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const VALID_STEPS = ["1", "2", "3", "4", "5"] as const;
type ValidStep = (typeof VALID_STEPS)[number];

interface SetupStepPageProps {
  params: Promise<{ step: string }>;
}

/**
 * Calculate the maximum step the user is allowed to access based on their setup progress.
 */
function getMaxAllowedStep(settings: AppSettings | null): number {
  if (!settings) return 1;

  // Step 2 (Google) requires completing step 1 (Welcome) - no explicit check needed
  // Step 3 (Notion) requires Google connected with calendar selected
  if (!settings.google?.refreshToken || !settings.google?.calendarId) {
    return 2;
  }

  // Step 4 (Mapping) requires Notion configured
  if (!settings.notion?.apiToken || !settings.notion?.databaseId) {
    return 3;
  }

  // Step 5 (Test) requires field mapping configured
  if (!settings.fieldMapping) {
    return 4;
  }

  return 5;
}

export default async function SetupStepPage({ params }: SetupStepPageProps) {
  const { step } = await params;

  // Validate step parameter
  if (!VALID_STEPS.includes(step as ValidStep)) {
    notFound();
  }

  const currentStep = Number.parseInt(step, 10) as 1 | 2 | 3 | 4 | 5;

  // Check if setup is already complete
  const setupComplete = await isSetupComplete();
  if (setupComplete) {
    redirect("/");
  }

  // Server-side step validation based on setup status
  const settings = await getSettings();
  const maxAllowedStep = getMaxAllowedStep(settings);

  if (currentStep > maxAllowedStep) {
    redirect(`/setup/${maxAllowedStep}`);
  }

  return <SetupWizard currentStep={currentStep} />;
}

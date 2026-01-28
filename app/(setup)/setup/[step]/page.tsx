import { SetupWizard } from "@/components/setup";
import { isSetupComplete } from "@/lib/settings";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const VALID_STEPS = ["1", "2", "3", "4", "5"] as const;
type ValidStep = (typeof VALID_STEPS)[number];

interface SetupStepPageProps {
  params: Promise<{ step: string }>;
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

  return <SetupWizard currentStep={currentStep} />;
}

import { SetupWizard } from "@/components/setup";
import { isSetupComplete } from "@/lib/settings";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const setupComplete = await isSetupComplete();

  if (setupComplete) {
    redirect("/");
  }

  return <SetupWizard />;
}

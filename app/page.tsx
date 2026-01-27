import { Dashboard } from "@/components/dashboard/dashboard";
import { isSetupComplete } from "@/lib/settings";
import { redirect } from "next/navigation";

// Force dynamic rendering - this page checks Redis for setup status
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Check if setup is complete
  const setupComplete = await isSetupComplete();

  if (!setupComplete) {
    redirect("/setup");
  }

  return <Dashboard />;
}

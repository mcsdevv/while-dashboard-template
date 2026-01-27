import { AppShell } from "@/components/shell";
import { isSetupComplete } from "@/lib/settings";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const setupComplete = await isSetupComplete();
  if (!setupComplete) {
    redirect("/setup");
  }

  return <AppShell>{children}</AppShell>;
}

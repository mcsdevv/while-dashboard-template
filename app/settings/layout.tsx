import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return <>{children}</>;
}

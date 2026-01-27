"use client";

import { SessionProvider } from "@/components/auth/session-provider";
import { ToastProvider } from "@/shared/ui";
import { Toaster } from "@/shared/ui";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
  session: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ToastProvider>
        {children}
        <Toaster />
      </ToastProvider>
    </SessionProvider>
  );
}

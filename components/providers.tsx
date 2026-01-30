"use client";

import { SessionProvider } from "@/components/auth/session-provider";
import { ToastProvider, Toaster } from "@/shared/ui";
import type { Session } from "next-auth";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
  session: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <SessionProvider session={session}>
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

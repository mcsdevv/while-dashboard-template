"use client";

import { AppHeader } from "./header";
import { MobileNav } from "./mobile-nav";
import { AppSidebar } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}

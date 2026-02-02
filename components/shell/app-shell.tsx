"use client";

import { CalendarPreferencesProvider } from "./calendar-preferences-context";
import { AppHeader } from "./header";
import { MobileNav } from "./mobile-nav";
import { AppSidebar } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";
import { SidebarVisibilityProvider } from "./sidebar-visibility-context";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <SidebarVisibilityProvider>
        <CalendarPreferencesProvider>
          <div className="flex flex-1">
            <AppSidebar />
            <div className="flex flex-1 flex-col">
              <AppHeader />
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
            <MobileNav />
          </div>
        </CalendarPreferencesProvider>
      </SidebarVisibilityProvider>
    </SidebarProvider>
  );
}

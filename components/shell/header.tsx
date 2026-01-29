"use client";

import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";
import { ThemeToggleWrapper } from "@/components/theme-toggle-wrapper";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useSidebar } from "./sidebar-context";

export function AppHeader() {
  const { setMobileOpen } = useSidebar();

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 items-center gap-4 px-4 lg:px-6",
        "border-b border-border bg-background",
        "transition-[padding-left] duration-200",
      )}
    >
      {/* Mobile menu trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden p-2 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        aria-label="Open menu"
      >
        <Menu aria-hidden="true" className="w-5 h-5" />
      </button>

      {/* Mobile logo */}
      <Link
        href="/"
        className="lg:hidden font-semibold text-xl tracking-tight"
      >
        While
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Theme toggle (mobile only, desktop is in sidebar) */}
        <div className="lg:hidden">
          <ThemeToggleWrapper />
        </div>
        <UserMenu />
      </div>
    </header>
  );
}

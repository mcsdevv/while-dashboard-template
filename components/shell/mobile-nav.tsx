"use client";

import { footerLinks, navigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import Link from "next/link";
import { useSidebar } from "./sidebar-context";
import { SidebarNav } from "./sidebar-nav";

export function MobileNav() {
  const { mobileOpen, setMobileOpen } = useSidebar();

  if (!mobileOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className={cn(
          "fixed inset-0 z-40 bg-background/80 lg:hidden",
          "animate-in fade-in duration-200",
        )}
        onClick={() => setMobileOpen(false)}
        aria-label="Close menu"
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 lg:hidden overscroll-contain",
          "bg-sidebar border-r border-sidebar-border",
          "animate-in slide-in-from-left duration-200",
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
          <Link
            href="/"
            className="font-semibold text-xl tracking-tight"
            onClick={() => setMobileOpen(false)}
          >
            While
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-2 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            aria-label="Close menu"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav items={navigation} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {footerLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            v{process.env.NEXT_PUBLIC_APP_VERSION}
          </p>
        </div>
      </div>
    </>
  );
}

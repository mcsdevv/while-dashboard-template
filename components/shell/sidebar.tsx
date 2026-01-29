"use client";

import { cn } from "@/lib/utils";
import { navigation, footerLinks } from "@/lib/navigation";
import { ThemeToggleWrapper } from "@/components/theme-toggle-wrapper";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { SidebarNav } from "./sidebar-nav";
import { useSidebar } from "./sidebar-context";

export function AppSidebar() {
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 z-30",
        "bg-sidebar border-r border-sidebar-border",
        "transition-all duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        <Link
          href="/"
          className={cn(
            "font-semibold tracking-tight transition-all duration-200",
            collapsed ? "text-lg" : "text-xl",
          )}
        >
          {collapsed ? "W" : "While"}
        </Link>
        <button
          onClick={toggleCollapsed}
          className={cn(
            "p-1.5 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
            collapsed && "absolute -right-3 top-4 bg-sidebar border border-sidebar-border",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight aria-hidden="true" className="w-4 h-4" />
          ) : (
            <ChevronLeft aria-hidden="true" className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav items={navigation} />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-4">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          <ThemeToggleWrapper />
          {!collapsed && (
            <span className="text-xs text-muted-foreground">v0.1.0</span>
          )}
        </div>
        {!collapsed && (
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
        )}
      </div>
    </aside>
  );
}

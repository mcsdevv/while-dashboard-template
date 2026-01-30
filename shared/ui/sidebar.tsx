"use client";

import * as React from "react";

import { cn } from "./utils";

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  collapsed?: boolean;
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, collapsed = false, children, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(
        "h-screen sticky top-0 flex flex-col transition-all duration-200 border-r border-border bg-card",
        collapsed ? "w-16" : "w-64",
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  ),
);
Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex h-14 items-center gap-2 px-4 border-b border-border", className)}
      {...props}
    />
  ),
);
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 overflow-y-auto py-4", className)} {...props} />
  ),
);
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 border-t border-border", className)} {...props} />
  ),
);
SidebarFooter.displayName = "SidebarFooter";

const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-3 py-2", className)} {...props} />
  ),
);
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider",
        className,
      )}
      {...props}
    />
  ),
);
SidebarGroupLabel.displayName = "SidebarGroupLabel";

interface SidebarNavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  collapsed?: boolean;
  indicator?: React.ReactNode;
}

const SidebarNavItem = React.forwardRef<HTMLButtonElement, SidebarNavItemProps>(
  ({ className, active, icon, collapsed, indicator, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "relative w-full flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "bg-muted text-foreground font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-2",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">{icon}</span>
      )}
      {!collapsed && <span className="truncate">{children}</span>}
      {!collapsed && indicator && <span className="ml-auto">{indicator}</span>}
      {collapsed && indicator && <span className="absolute right-1.5 top-1.5">{indicator}</span>}
    </button>
  ),
);
SidebarNavItem.displayName = "SidebarNavItem";

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarNavItem,
};

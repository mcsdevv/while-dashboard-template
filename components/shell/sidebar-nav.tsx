"use client";

import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { SidebarNavItem } from "@/shared/ui";
import { AlertTriangle, ChevronDown } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { useSidebar } from "./sidebar-context";

interface SidebarNavProps {
  items: NavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();
  const { collapsed, setMobileOpen } = useSidebar();
  const [syncWarning, setSyncWarning] = useState(false);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const fetchSyncStatus = async () => {
      try {
        const response = await fetch("/api/setup/sync", { signal: controller.signal });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        const googleActive = Boolean(data?.google?.active);
        const notionActive = Boolean(data?.notion?.active);
        const notionVerified = Boolean(data?.notion?.verified);
        if (isActive) {
          setSyncWarning(!(googleActive && notionActive && notionVerified));
        }
      } catch {
        if (isActive) {
          setSyncWarning(true);
        }
      }
    };

    fetchSyncStatus();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  return (
    <nav className="space-y-1 px-3">
      {items.map((item) => (
        <NavItemComponent
          key={item.href}
          item={item}
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={() => setMobileOpen(false)}
          indicator={
            item.href === "/setup/1" && syncWarning && !collapsed ? (
              <span title="Real-time sync needs attention">
                <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 text-amber-500" />
              </span>
            ) : undefined
          }
          iconWarning={item.href === "/setup/1" && syncWarning && collapsed}
        />
      ))}
    </nav>
  );
}

interface NavItemComponentProps {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
  indicator?: ReactNode;
  iconWarning?: boolean;
  depth?: number;
}

function NavItemComponent({
  item,
  pathname,
  collapsed,
  onNavigate,
  indicator,
  iconWarning,
  depth = 0,
}: NavItemComponentProps) {
  const isActive =
    pathname === item.href || item.children?.some((child) => pathname === child.href);
  const [expanded, setExpanded] = useState(isActive);

  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  if (hasChildren && !collapsed) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isActive
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Icon aria-hidden="true" className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1 text-left truncate">{item.title}</span>
          <ChevronDown
            aria-hidden="true"
            className={cn("w-4 h-4 transition-transform duration-200", expanded && "rotate-180")}
          />
        </button>
        {expanded && (
          <div className="ml-4 pl-4 border-l border-border space-y-1">
            {item.children!.map((child) => (
              <NavItemComponent
                key={child.href}
                item={child}
                pathname={pathname}
                collapsed={collapsed}
                onNavigate={onNavigate}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const content = (
    <SidebarNavItem
      active={pathname === item.href}
      icon={<Icon aria-hidden="true" className={cn("w-5 h-5", iconWarning && "text-amber-500")} />}
      collapsed={collapsed}
      onClick={onNavigate}
      indicator={indicator}
    >
      {item.title}
    </SidebarNavItem>
  );

  const linkElement = item.external ? (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className="block">
      {content}
    </a>
  ) : (
    <Link href={item.href as Route} className="block">
      {content}
    </Link>
  );

  if (iconWarning) {
    return item.external ? (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        title="Real-time sync needs attention"
      >
        {content}
      </a>
    ) : (
      <Link href={item.href as Route} className="block" title="Real-time sync needs attention">
        {content}
      </Link>
    );
  }

  return linkElement;
}

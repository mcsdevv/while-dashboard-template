"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./utils";

interface CollapsibleTriggerProps {
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  chevronPosition?: "left" | "right";
}

export function CollapsibleTrigger({
  isOpen,
  onToggle,
  children,
  className,
  chevronPosition = "left",
}: CollapsibleTriggerProps) {
  const ChevronIcon = isOpen ? ChevronDown : ChevronRight;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className={cn(
        "flex items-center gap-2 cursor-pointer",
        chevronPosition === "right" && "justify-between",
        className
      )}
    >
      {chevronPosition === "left" && (
        <ChevronIcon className="h-4 w-4 flex-shrink-0" />
      )}
      {children}
      {chevronPosition === "right" && (
        <ChevronIcon
          className={cn(
            "h-4 w-4 flex-shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      )}
    </button>
  );
}

interface CollapsibleContentProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
}

export function CollapsibleContent({
  isOpen,
  children,
  className,
}: CollapsibleContentProps) {
  if (!isOpen) return null;

  return <div className={className}>{children}</div>;
}

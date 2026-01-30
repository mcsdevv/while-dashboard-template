"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StatusCardVariant = "success" | "error" | "warning";

interface StatusCardProps {
  icon: LucideIcon;
  title: string;
  message: string;
  details?: string;
  variant?: StatusCardVariant;
  className?: string;
  iconClassName?: string;
}

const variantStyles: Record<
  StatusCardVariant,
  { border: string; bg: string; iconBg: string; iconColor: string }
> = {
  success: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-500",
  },
  error: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-500",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-600",
  },
};

export function StatusCard({
  icon: Icon,
  title,
  message,
  details,
  variant = "success",
  className,
  iconClassName,
}: StatusCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn("border p-4 transition-all duration-300", styles.border, styles.bg, className)}
    >
      <div className="flex items-center gap-3">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center", styles.iconBg)}>
          <Icon className={cn("h-5 w-5", styles.iconColor, iconClassName)} />
        </div>
        <div className="flex-1 min-w-0">
          <p>
            <span className="font-medium text-foreground">{title}</span>
            <span className="text-muted-foreground">: {message}</span>
          </p>
        </div>
      </div>
      {details && <p className="mt-2 pl-11 text-sm text-muted-foreground">{details}</p>}
    </div>
  );
}

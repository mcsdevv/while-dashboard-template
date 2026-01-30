"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

interface ThemeToggleProps {
  theme?: string;
  setTheme: (theme: string) => void;
  resolvedTheme?: string;
}

export function ThemeToggle({ theme, setTheme, resolvedTheme }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Monitor aria-hidden="true" className="size-4" />
        <span>Theme</span>
      </div>
    );
  }

  const currentValue = theme ?? "system";
  const currentTheme = themes.find((t) => t.value === currentValue) ?? themes[2];
  // Use the selected theme's icon (Monitor for System, Sun for Light, Moon for Dark)
  const Icon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm">
        <Icon aria-hidden="true" className="size-4" />
        <span>{currentTheme.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        {themes.map(({ value, label, icon: ThemeIcon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="flex items-center gap-2"
          >
            <ThemeIcon aria-hidden="true" className="size-4" />
            <span className="flex-1">{label}</span>
            {currentValue === value && <Check aria-hidden="true" className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

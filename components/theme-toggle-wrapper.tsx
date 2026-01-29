"use client";

import { ThemeToggle } from "@/shared/ui";
import { useTheme } from "next-themes";

export function ThemeToggleWrapper() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return <ThemeToggle theme={theme} setTheme={setTheme} resolvedTheme={resolvedTheme} />;
}

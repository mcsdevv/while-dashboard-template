"use client";

import { Footer } from "@/shared/ui";
import { useTheme } from "next-themes";

export function FooterWrapper() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return <Footer theme={theme} setTheme={setTheme} resolvedTheme={resolvedTheme} />;
}

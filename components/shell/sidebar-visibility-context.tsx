"use client";

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";

interface SidebarVisibilityContextValue {
  hiddenItems: Set<string>;
  setItemVisibility: (id: string, visible: boolean) => void;
  isVisible: (id: string) => boolean;
}

const SidebarVisibilityContext = createContext<SidebarVisibilityContextValue | null>(null);

const STORAGE_KEY = "sidebar-visibility";
const ALWAYS_VISIBLE = new Set(["settings"]);

export function SidebarVisibilityProvider({ children }: { children: ReactNode }) {
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHiddenItems(new Set(parsed.filter((id) => !ALWAYS_VISIBLE.has(id))));
        }
      } catch {
        // Invalid data, use default
      }
    }
  }, []);

  const setItemVisibility = useCallback((id: string, visible: boolean) => {
    if (ALWAYS_VISIBLE.has(id)) return;

    setHiddenItems((prev) => {
      const next = new Set(prev);
      if (visible) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isVisible = useCallback(
    (id: string) => {
      if (ALWAYS_VISIBLE.has(id)) return true;
      return !hiddenItems.has(id);
    },
    [hiddenItems],
  );

  return (
    <SidebarVisibilityContext.Provider value={{ hiddenItems, setItemVisibility, isVisible }}>
      {children}
    </SidebarVisibilityContext.Provider>
  );
}

export function useSidebarVisibility() {
  const context = useContext(SidebarVisibilityContext);
  if (!context) {
    throw new Error("useSidebarVisibility must be used within a SidebarVisibilityProvider");
  }
  return context;
}

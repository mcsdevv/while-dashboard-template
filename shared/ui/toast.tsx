"use client";

import { cn } from "./utils";
import * as React from "react";

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, "id">) => string;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);
  const timeoutRefs = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Clear all timeouts on unmount
  React.useEffect(() => {
    const timeouts = timeoutRefs.current;
    return () => {
      for (const timeout of timeouts.values()) {
        clearTimeout(timeout);
      }
      timeouts.clear();
    };
  }, []);

  const addToast = React.useCallback((toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration (default 5 seconds)
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timeoutRefs.current.delete(id);
      }, duration);
      timeoutRefs.current.set(id, timeoutId);
    }

    return id;
  }, []);

  const removeToast = React.useCallback((id: string) => {
    // Clear timeout if manually dismissed
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function Toast({ id, title, description, variant = "default" }: ToastProps) {
  const { removeToast } = useToast();

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-none border p-4 shadow-lg transition-all",
        variant === "default"
          ? "bg-background border-border"
          : "bg-foreground/5 border-foreground/20",
      )}
    >
      <div className="flex-1 space-y-1">
        {title && <p className="text-sm font-medium text-foreground">{title}</p>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => removeToast(id)}
        aria-label="Dismiss notification"
        className="inline-flex h-6 w-6 items-center justify-center rounded-none text-muted-foreground hover:text-foreground"
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

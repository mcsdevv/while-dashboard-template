"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import * as React from "react";
import { cn } from "./utils";

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

  const Icon =
    variant === "success" ? CheckCircle2 : variant === "destructive" ? AlertCircle : null;

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg",
        "animate-in slide-in-from-bottom-5 fade-in-0 duration-300",
        variant === "success" && "border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-500/20",
        variant === "destructive" &&
          "border-destructive/50 bg-destructive/10 dark:bg-destructive/20",
        variant === "default" && "bg-card border-border",
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 mt-0.5",
            variant === "success" && "text-emerald-500",
            variant === "destructive" && "text-destructive",
          )}
        />
      )}
      <div className="flex-1 space-y-1">
        {title && (
          <p
            className={cn(
              "text-sm font-semibold leading-tight",
              variant === "success" && "text-emerald-600 dark:text-emerald-400",
              variant === "destructive" && "text-destructive",
              variant === "default" && "text-foreground",
            )}
          >
            {title}
          </p>
        )}
        {description && <p className="text-sm text-muted-foreground leading-snug">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => removeToast(id)}
        aria-label="Dismiss notification"
        className="inline-flex shrink-0 cursor-pointer h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

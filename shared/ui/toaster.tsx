"use client";

import { Toast, useToast } from "./toast";

export function Toaster() {
  const { toasts } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <section
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col gap-2 p-4 md:max-w-[380px]"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </section>
  );
}

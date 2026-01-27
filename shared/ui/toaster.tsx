"use client";

import { Toast, useToast } from "./toast";

export function Toaster() {
  const { toasts } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}

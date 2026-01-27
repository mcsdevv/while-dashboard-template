"use client";

import { Button } from "@/shared/ui";
import { ServerCrash } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 relative overflow-hidden">
      {/* Large background error code */}
      <div
        className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
        style={{ animation: "pulse-subtle 3s ease-in-out infinite" }}
      >
        <span className="text-[120px] sm:text-[180px] font-semibold tracking-tighter text-foreground/5">
          500
        </span>
      </div>

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center text-center"
        style={{ animation: "fade-in-up 0.5s ease-out" }}
      >
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-full border border-border flex items-center justify-center mb-6"
          style={{ animation: "float 4s ease-in-out infinite" }}
        >
          <ServerCrash className="w-7 h-7 text-muted-foreground" />
        </div>

        {/* Text */}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
          Something went wrong
        </h1>
        <p className="text-muted-foreground text-base max-w-md mb-8">
          An unexpected error occurred. We&apos;ve been notified and are looking into it.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="ghost" render={<Link href="/" />}>
            Back to Dashboard
          </Button>
          <Button onClick={reset}>Try Again</Button>
        </div>

        {/* Error digest */}
        {error.digest && (
          <p className="mt-6 text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
        )}
      </div>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes pulse-subtle {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

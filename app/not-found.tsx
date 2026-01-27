"use client";

import { Button } from "@/shared/ui";
import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 relative overflow-hidden">
      {/* Large background error code */}
      <div
        className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
        style={{ animation: "pulse-subtle 3s ease-in-out infinite" }}
      >
        <span className="text-[120px] sm:text-[180px] font-semibold tracking-tighter text-foreground/5">
          404
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
          <FileQuestion className="w-7 h-7 text-muted-foreground" />
        </div>

        {/* Text */}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">Page not found</h1>
        <p className="text-muted-foreground text-base max-w-md mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.back()}>
            Go Back
          </Button>
          <Button render={<Link href="/" />}>Back to Dashboard</Button>
        </div>
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

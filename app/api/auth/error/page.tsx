"use client";

import { Button } from "@/shared/ui";
import { ShieldX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Configuration Error",
    description:
      "There is a problem with the server configuration. Please contact the administrator.",
  },
  AccessDenied: {
    title: "Access Denied",
    description:
      "You do not have permission to sign in. Your email may not be on the allowed list.",
  },
  Verification: {
    title: "Verification Error",
    description: "The verification link may have expired or already been used.",
  },
  OAuthSignin: {
    title: "Sign In Error",
    description: "Could not start the sign in process. Please try again.",
  },
  OAuthCallback: {
    title: "Callback Error",
    description: "Could not complete the sign in process. Please try again.",
  },
  OAuthCreateAccount: {
    title: "Account Error",
    description: "Could not create your account. Please try again.",
  },
  EmailCreateAccount: {
    title: "Account Error",
    description: "Could not create your account. Please try again.",
  },
  Callback: {
    title: "Callback Error",
    description: "Could not complete the sign in process. Please try again.",
  },
  OAuthAccountNotLinked: {
    title: "Account Not Linked",
    description:
      "This email is already associated with another account. Sign in with your original provider.",
  },
  EmailSignin: {
    title: "Email Error",
    description: "Could not send the sign in email. Please try again.",
  },
  CredentialsSignin: {
    title: "Sign In Failed",
    description: "The credentials you provided are incorrect.",
  },
  SessionRequired: {
    title: "Session Required",
    description: "Please sign in to access this page.",
  },
  Default: {
    title: "Authentication Error",
    description: "An error occurred during authentication. Please try again.",
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";

  const { title, description } = errorMessages[error] || errorMessages.Default;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 relative overflow-hidden">
      {/* Large background text */}
      <div
        className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
        style={{ animation: "pulse-subtle 3s ease-in-out infinite" }}
      >
        <span className="text-[80px] sm:text-[120px] font-semibold tracking-tighter text-foreground/5">
          AUTH
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
          <ShieldX className="w-7 h-7 text-muted-foreground" />
        </div>

        {/* Text */}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">{title}</h1>
        <p className="text-muted-foreground text-base max-w-md mb-8">{description}</p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="ghost" render={<Link href="/" />}>
            Back to Home
          </Button>
          <Button render={<Link href="/api/auth/signin" />}>Try Again</Button>
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

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}

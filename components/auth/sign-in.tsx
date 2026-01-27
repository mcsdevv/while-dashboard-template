"use client";

import { Button } from "@/shared/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { signIn } from "next-auth/react";

/**
 * Sign-in component with Google OAuth
 * Shown to unauthenticated users
 */
export function SignIn() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="w-full max-w-md border-border/40">
        <CardHeader className="space-y-2 text-center pb-8">
          <CardTitle className="text-3xl font-bold tracking-tight">While</CardTitle>
          <CardDescription className="text-base">
            Real-time bidirectional synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            variant="outline"
            className="w-full h-11 text-base"
            size="lg"
          >
            Sign in with Google
          </Button>
          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            Access restricted to authorized email addresses
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

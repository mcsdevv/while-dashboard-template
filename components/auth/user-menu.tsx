"use client";

import { Button } from "@/shared/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

/**
 * User menu with profile info and sign-out button
 */
export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
        {session.user.image && (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-5 h-5 rounded-full"
          />
        )}
        <span className="hidden sm:inline">{session.user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>Settings</DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { CheckCircle2, XCircle } from "lucide-react";

interface SyncStateDebug {
  hasSyncToken: boolean;
  syncTokenPreview?: string;
  lastSync?: string;
}

interface SyncStateCardProps {
  syncState: SyncStateDebug;
}

function formatDateTime(isoString: string | undefined): string {
  if (!isoString) return "Never";
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SyncStateCard({ syncState }: SyncStateCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Sync State</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            {syncState.hasSyncToken ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium">Sync Token</p>
              {syncState.hasSyncToken ? (
                <p className="text-xs text-muted-foreground font-mono">
                  {syncState.syncTokenPreview}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Not configured (will do full sync)</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Last Sync</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(syncState.lastSync)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

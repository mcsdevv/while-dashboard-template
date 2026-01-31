"use client";

import { useToast } from "@/lib/toast";
import { Button } from "@/shared/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ResetType = "mapping" | "sync" | "all";

export function DangerZone() {
  const router = useRouter();
  const { addToast } = useToast();
  const [resetting, setResetting] = useState<ResetType | null>(null);
  const [confirmingReset, setConfirmingReset] = useState<ResetType | null>(null);

  const handleReset = async (type: ResetType) => {
    if (confirmingReset !== type) {
      setConfirmingReset(type);
      return;
    }

    setResetting(type);

    try {
      const response = await fetch("/api/settings/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset");
      }

      addToast({
        title: data.message,
        variant: "success",
      });
      setConfirmingReset(null);

      if (type === "all" && data.redirect) {
        setTimeout(() => {
          router.push(data.redirect);
        }, 1500);
      }
    } catch (err) {
      addToast({
        title: "Reset failed",
        description: err instanceof Error ? err.message : "Failed to reset",
        variant: "destructive",
      });
    } finally {
      setResetting(null);
    }
  };

  const handleCancel = () => {
    setConfirmingReset(null);
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>
          These actions can affect your sync configuration. Proceed with caution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reset Field Mapping */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-destructive/30 p-4">
          <div>
            <h4 className="text-sm font-medium">Reset Field Mapping</h4>
            <p className="text-xs text-muted-foreground">
              Reset all field mappings to their default values
            </p>
          </div>
          {confirmingReset === "mapping" ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleReset("mapping")}
                disabled={resetting === "mapping"}
                className="w-full sm:w-auto"
              >
                {resetting === "mapping" ? "Resetting..." : "Confirm"}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReset("mapping")}
              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground w-full sm:w-auto"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Clear Sync State */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-destructive/30 p-4">
          <div>
            <h4 className="text-sm font-medium">Clear Sync State</h4>
            <p className="text-xs text-muted-foreground">
              Remove GCal Event IDs from Notion (may cause duplicates)
            </p>
          </div>
          {confirmingReset === "sync" ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleReset("sync")}
                disabled={resetting === "sync"}
                className="w-full sm:w-auto"
              >
                {resetting === "sync" ? "Clearing..." : "Confirm"}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReset("sync")}
              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground w-full sm:w-auto"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Reset Everything */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-destructive/30 p-4">
          <div>
            <h4 className="text-sm font-medium">Reset Everything</h4>
            <p className="text-xs text-muted-foreground">
              Delete all settings and return to setup wizard
            </p>
          </div>
          {confirmingReset === "all" ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleReset("all")}
                disabled={resetting === "all"}
                className="w-full sm:w-auto"
              >
                {resetting === "all" ? "Resetting..." : "Confirm Delete"}
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleReset("all")}
              className="w-full sm:w-auto"
            >
              Delete All
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

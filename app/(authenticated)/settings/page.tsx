"use client";

import { ConnectionStatus } from "@/components/settings/connection-status";
import { DangerZone } from "@/components/settings/danger-zone";
import { GoogleSettings } from "@/components/settings/google-settings";
import { HistoricalSync } from "@/components/settings/historical-sync";
import { NotionSettings } from "@/components/settings/notion-settings";
import { SidebarSettings } from "@/components/settings/sidebar-settings";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { SkeletonSettingsPage } from "@/shared/ui";
import { Radio } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Settings {
  google: {
    isConfigured: boolean;
    isConnected: boolean;
    calendarId: string | null;
    calendarName: string | null;
    connectedAt: string | null;
    oauthAppPublished?: boolean;
  } | null;
  notion: {
    databaseId: string | null;
    databaseName: string | null;
    isConnected: boolean;
  } | null;
  setupCompleted: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings");
      if (!response.ok) {
        throw new Error("Failed to load settings");
      }
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (loading) {
    return <SkeletonSettingsPage />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="p-8 text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your sync configuration and connections
        </p>
      </div>

      {/* Connection Status */}
      <ConnectionStatus google={settings?.google ?? null} notion={settings?.notion ?? null} />

      {/* Sidebar Settings */}
      <SidebarSettings />

      {/* Service Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GoogleSettings settings={settings?.google ?? null} onSettingsChange={fetchSettings} />
        <NotionSettings settings={settings?.notion ?? null} />
      </div>

      {/* Historical Sync */}
      <HistoricalSync />

      {/* Danger Zone */}
      <DangerZone />

      {/* Webhook Debugging */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Webhook Debugging
          </CardTitle>
          <CardDescription>Advanced webhook status, logs, and debugging tools</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/webhooks">
            <Button variant="outline" className="w-full sm:w-auto">
              View Webhook Status & Debug Tools
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

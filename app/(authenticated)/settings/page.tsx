"use client";

import { ConnectionStatus } from "@/components/settings/connection-status";
import { DangerZone } from "@/components/settings/danger-zone";
import { FieldMappingEditor } from "@/components/settings/field-mapping-editor";
import { GoogleSettings } from "@/components/settings/google-settings";
import { NotionSettings } from "@/components/settings/notion-settings";
import { Button, Card, CardContent } from "@/shared/ui";
import { SkeletonSettingsPage } from "@/shared/ui";
import { useCallback, useEffect, useState } from "react";

interface Settings {
  google: {
    isConfigured: boolean;
    isConnected: boolean;
    calendarId: string | null;
    calendarName: string | null;
    connectedAt: string | null;
  } | null;
  notion: {
    databaseId: string | null;
    databaseName: string | null;
    isConnected: boolean;
  } | null;
  fieldMapping: {
    title: string;
    date: string;
    description: string;
    location: string;
    gcalEventId: string;
    reminders: string;
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

      {/* Service Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GoogleSettings settings={settings?.google ?? null} />
        <NotionSettings settings={settings?.notion ?? null} />
      </div>

      {/* Field Mapping */}
      <FieldMappingEditor initialMapping={settings?.fieldMapping ?? null} onSave={fetchSettings} />

      {/* Danger Zone */}
      <DangerZone />
    </div>
  );
}

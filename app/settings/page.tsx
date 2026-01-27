"use client";

import { UserMenu } from "@/components/auth/user-menu";
import { ConnectionStatus } from "@/components/settings/connection-status";
import { DangerZone } from "@/components/settings/danger-zone";
import { FieldMappingEditor } from "@/components/settings/field-mapping-editor";
import { GoogleSettings } from "@/components/settings/google-settings";
import { NotionSettings } from "@/components/settings/notion-settings";
import { Button } from "@/shared/ui";
import { SkeletonSettingsPage } from "@/shared/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

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

  const fetchSettings = async () => {
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
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return <SkeletonSettingsPage />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your sync configuration and connections
            </p>
          </div>
          <UserMenu />
        </div>

        {/* Connection Status */}
        <ConnectionStatus google={settings?.google ?? null} notion={settings?.notion ?? null} />

        {/* Service Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GoogleSettings settings={settings?.google ?? null} />
          <NotionSettings settings={settings?.notion ?? null} />
        </div>

        {/* Field Mapping */}
        <FieldMappingEditor
          initialMapping={settings?.fieldMapping ?? null}
          onSave={fetchSettings}
        />

        {/* Danger Zone */}
        <DangerZone />
      </div>
    </div>
  );
}

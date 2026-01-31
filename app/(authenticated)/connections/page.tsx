"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/shared/ui";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ConnectionsStatus {
  google: {
    isConfigured: boolean;
    isConnected: boolean;
    calendarName: string | null;
  } | null;
  notion: {
    isConnected: boolean;
    databaseName: string | null;
  } | null;
}

export default function ConnectionsPage() {
  const [status, setStatus] = useState<ConnectionsStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setStatus({
            google: data.google,
            notion: data.notion,
          });
        }
      } catch (error) {
        console.error("Error fetching connections:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your service integrations</p>
      </div>

      {/* Connection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Calendar */}
        <Card className="hover:bg-muted/50 transition-colors group">
          <Link href="/connections/google" className="block">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted flex items-center justify-center">
                    <Image
                      src="/icons/google-calendar.png"
                      alt="Google Calendar"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  </div>
                  <div>
                    <CardTitle>Google Calendar</CardTitle>
                    <CardDescription>
                      {status?.google?.calendarName || "Not connected"}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={status?.google?.isConnected ? "success" : "secondary"}>
                  {status?.google?.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sync events between your Google Calendar and Notion database.
              </p>
              <div className="mt-4 flex items-center text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                <span>Manage connection</span>
                <ExternalLink className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Link>
        </Card>

        {/* Notion */}
        <Card className="hover:bg-muted/50 transition-colors group">
          <Link href="/connections/notion" className="block">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted flex items-center justify-center">
                    <Image
                      src="/icons/notion.png"
                      alt="Notion"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  </div>
                  <div>
                    <CardTitle>Notion</CardTitle>
                    <CardDescription>
                      {status?.notion?.databaseName || "Not connected"}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={status?.notion?.isConnected ? "success" : "secondary"}>
                  {status?.notion?.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Connect to your Notion workspace and select a database to sync.
              </p>
              <div className="mt-4 flex items-center text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                <span>Manage connection</span>
                <ExternalLink className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}

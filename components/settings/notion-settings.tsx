"use client";

import { Badge } from "@/shared/ui";
import { Button } from "@/shared/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { useRouter } from "next/navigation";

interface NotionSettingsProps {
  settings: {
    databaseId: string | null;
    databaseName: string | null;
    isConnected: boolean;
  } | null;
}

export function NotionSettings({ settings }: NotionSettingsProps) {
  const router = useRouter();

  const handleReconnect = () => {
    router.push("/setup?step=notion");
  };

  const maskDatabaseId = (id: string | null) => {
    if (!id) return "Not selected";
    if (id.length <= 8) return id;
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Notion</CardTitle>
            <CardDescription>Manage your Notion integration</CardDescription>
          </div>
          <Badge variant={settings?.isConnected ? "success" : "destructive"}>
            {settings?.isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {settings?.isConnected ? (
          <div className="flex flex-col h-full">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                <span className="text-muted-foreground">Database</span>
                <span className="truncate">{settings.databaseName || "Not selected"}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                <span className="text-muted-foreground">Database ID</span>
                <span className="font-mono">{maskDatabaseId(settings.databaseId)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                <span className="text-muted-foreground">API Token</span>
                <span className="text-foreground">Configured</span>
              </div>
            </div>
            <div className="mt-auto pt-4">
              <Button variant="outline" onClick={handleReconnect} className="w-full">
                Reconnect Notion
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Notion is not connected. Complete the setup to start syncing events.
            </p>
            <Button onClick={handleReconnect}>Connect Notion</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

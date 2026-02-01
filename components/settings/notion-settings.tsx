"use client";

import { NotionIcon } from "@/components/icons/brand-icons";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface NotionSettingsProps {
  settings: {
    databaseId: string | null;
    databaseName: string | null;
    isConnected: boolean;
  } | null;
}

export function NotionSettings({ settings }: NotionSettingsProps) {
  const router = useRouter();
  const [nameCopied, setNameCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  const copyToClipboard = async (value: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Silent fail - clipboard API may not be available
    }
  };

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
          <div className="flex items-center gap-3">
            <NotionIcon size="lg" />
            <div>
              <CardTitle>Notion</CardTitle>
              <CardDescription>Manage your Notion integration</CardDescription>
            </div>
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
                {settings.databaseName ? (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(settings.databaseName!, setNameCopied)}
                    className="inline-flex items-center gap-1.5 hover:text-primary transition-colors truncate"
                    aria-label={
                      nameCopied
                        ? `Copied ${settings.databaseName}`
                        : `Copy ${settings.databaseName} to clipboard`
                    }
                  >
                    <span className="truncate">{settings.databaseName}</span>
                    {nameCopied ? (
                      <Check aria-hidden="true" className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <Copy
                        aria-hidden="true"
                        className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                      />
                    )}
                  </button>
                ) : (
                  <span className="truncate">Not selected</span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                <span className="text-muted-foreground">Database ID</span>
                {settings.databaseId ? (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(settings.databaseId!, setIdCopied)}
                    className="inline-flex items-center gap-1.5 hover:text-primary transition-colors font-mono"
                    aria-label={idCopied ? "Copied database ID" : "Copy database ID to clipboard"}
                  >
                    <span>{maskDatabaseId(settings.databaseId)}</span>
                    {idCopied ? (
                      <Check aria-hidden="true" className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <Copy
                        aria-hidden="true"
                        className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                      />
                    )}
                  </button>
                ) : (
                  <span className="font-mono">Not selected</span>
                )}
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

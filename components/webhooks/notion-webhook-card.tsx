"use client";

import { NotionIcon } from "@/components/icons/brand-icons";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { AlertTriangle, CheckCircle2, ExternalLink, XCircle } from "lucide-react";

interface NotionWebhookDebugStatus {
  configured: boolean;
  active: boolean;
  verified: boolean;
  databaseId?: string;
  verificationToken?: string;
  createdAt?: string;
  reason?: string;
}

interface NotionWebhookCardProps {
  status: NotionWebhookDebugStatus;
}

function formatDateTime(isoString: string | undefined): string {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusIcon({ status }: { status: NotionWebhookDebugStatus }) {
  if (!status.configured) {
    return <XCircle className="h-5 w-5 text-muted-foreground" />;
  }
  if (!status.active) {
    return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  }
  return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
}

function StatusBadge({ status }: { status: NotionWebhookDebugStatus }) {
  if (!status.configured) {
    return <Badge variant="outline">Not Configured</Badge>;
  }
  if (!status.verified) {
    return <Badge variant="secondary">Verification Required</Badge>;
  }
  return <Badge variant="success">Active</Badge>;
}

function DetailRow({
  label,
  value,
  mono = false,
}: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm text-right break-all ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export function NotionWebhookCard({ status }: NotionWebhookCardProps) {
  const needsVerification = status.configured && !status.verified;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NotionIcon size="md" />
            <CardTitle className="text-base">Notion</CardTitle>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <StatusIcon status={status} />
          <div>
            <p className="text-sm font-medium">
              {status.configured
                ? status.active
                  ? "Webhook Active"
                  : "Webhook Inactive"
                : "No Webhook Configured"}
            </p>
            {status.reason && <p className="text-xs text-muted-foreground">{status.reason}</p>}
          </div>
        </div>

        {needsVerification && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
              Verify your webhook in the Notion integrations dashboard:
            </p>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://www.notion.so/my-integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                Open Notion Integrations
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        )}

        {status.configured && (
          <div className="space-y-0">
            <DetailRow label="Database ID" value={status.databaseId ?? "N/A"} mono />
            <DetailRow label="Verified" value={status.verified ? "Yes" : "No"} />
            <DetailRow label="Verification Token" value={status.verificationToken ?? "N/A"} />
            <DetailRow label="Created" value={formatDateTime(status.createdAt)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

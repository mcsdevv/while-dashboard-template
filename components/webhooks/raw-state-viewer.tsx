"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface RawStateViewerProps {
  googleChannel: unknown;
  notionSubscription: unknown;
  notionApiWebhooks: unknown;
}

function CollapsibleSection({
  title,
  data,
  defaultOpen = false,
}: {
  title: string;
  data: unknown;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-muted/50 transition-colors"
      >
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="text-sm font-medium">{title}</span>
        {data === null && <span className="text-xs text-muted-foreground">(not configured)</span>}
      </button>
      {isOpen && (
        <div className="border-t bg-muted/30 p-3">
          <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function RawStateViewer({
  googleChannel,
  notionSubscription,
  notionApiWebhooks,
}: RawStateViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <CardTitle className="text-base">Raw Redis State</CardTitle>
          <span className="text-xs text-muted-foreground">(for debugging)</span>
        </button>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-3">
          <CollapsibleSection title="Google Calendar Channel" data={googleChannel} />
          <CollapsibleSection title="Notion Subscription" data={notionSubscription} />
          <CollapsibleSection title="Notion API Webhooks" data={notionApiWebhooks} />
        </CardContent>
      )}
    </Card>
  );
}

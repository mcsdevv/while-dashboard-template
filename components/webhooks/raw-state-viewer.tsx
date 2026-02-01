"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui";
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
      <CollapsibleTrigger
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-medium">{title}</span>
        {data === null && <span className="text-xs text-muted-foreground">(not configured)</span>}
      </CollapsibleTrigger>
      <CollapsibleContent isOpen={isOpen} className="border-t bg-muted/30 p-3">
        <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CollapsibleContent>
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
        <CollapsibleTrigger
          isOpen={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
          className="text-left"
        >
          <CardTitle className="text-base">Raw Redis State</CardTitle>
          <span className="text-xs text-muted-foreground">(for debugging)</span>
        </CollapsibleTrigger>
      </CardHeader>
      <CollapsibleContent isOpen={isExpanded}>
        <CardContent className="space-y-3">
          <CollapsibleSection title="Google Calendar Channel" data={googleChannel} />
          <CollapsibleSection title="Notion Subscription" data={notionSubscription} />
          <CollapsibleSection title="Notion API Webhooks" data={notionApiWebhooks} />
        </CardContent>
      </CollapsibleContent>
    </Card>
  );
}

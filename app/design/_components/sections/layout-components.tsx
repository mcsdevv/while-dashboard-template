"use client";

import {
  Separator,
  ScrollArea,
  AspectRatio,
  Textarea,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/shared/ui";
import { AlertCircle, Terminal } from "lucide-react";
import { ComponentSection, ComponentRow, ComponentGrid } from "../component-section";

export function LayoutComponentsSection() {
  return (
    <ComponentSection id="layout" title="LAYOUT_UTILITIES" description="Separators, scroll areas, alerts, and text areas">
      <ComponentRow label="SEPARATOR">
        <div className="w-full space-y-4">
          <p className="text-[13px]">SECTION_A // Performance metrics</p>
          <Separator />
          <p className="text-[13px]">SECTION_B // Training configuration</p>
        </div>
      </ComponentRow>

      <ComponentRow label="SCROLL_AREA">
        <ScrollArea className="h-[200px] w-full max-w-sm rounded-none border p-4">
          <div className="space-y-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">LOG_{String(i).padStart(2, "0")}</span>
                <span>0x{Math.random().toString(16).slice(2, 6).toUpperCase()}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </ComponentRow>

      <ComponentRow label="ASPECT_RATIO">
        <div className="w-full max-w-sm">
          <AspectRatio ratio={16 / 9}>
            <div className="flex h-full w-full items-center justify-center border border-border bg-card terminal-grid-bg">
              <span className="terminal-label">16:9 // VIEWPORT</span>
            </div>
          </AspectRatio>
        </div>
      </ComponentRow>

      <ComponentRow label="TEXTAREA">
        <div className="w-full max-w-sm space-y-2">
          <p className="terminal-label">SYSTEM_LOG</p>
          <Textarea
            placeholder="Enter system notes..."
            defaultValue={"[2024-01-15 08:30:12] Neural engine initialized\n[2024-01-15 08:30:14] Weight sync complete\n[2024-01-15 08:30:15] All systems nominal"}
          />
        </div>
      </ComponentRow>

      <ComponentGrid cols={2} label="ALERT">
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>SYSTEM_NOTICE</AlertTitle>
          <AlertDescription>
            Neural engine sync completed. All weights verified.
          </AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>ERROR</AlertTitle>
          <AlertDescription>
            Weight hash mismatch detected on shard 06.
          </AlertDescription>
        </Alert>
      </ComponentGrid>
    </ComponentSection>
  );
}

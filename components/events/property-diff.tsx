"use client";

import { type PropertyChange, formatDiffValue } from "@/lib/events/diff";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { Minus, Plus } from "lucide-react";

interface PropertyDiffProps {
  changes: PropertyChange[];
}

function DiffLine({ type, value }: { type: "added" | "removed"; value: string }) {
  const isAdded = type === "added";
  return (
    <div
      className={`flex items-start gap-2 px-3 py-1.5 font-mono text-xs ${
        isAdded ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
      }`}
    >
      {isAdded ? (
        <Plus className="h-3 w-3 mt-0.5 flex-shrink-0" />
      ) : (
        <Minus className="h-3 w-3 mt-0.5 flex-shrink-0" />
      )}
      <span className="whitespace-pre-wrap break-all">{value}</span>
    </div>
  );
}

function PropertyChangeItem({ change }: { change: PropertyChange }) {
  const beforeValue = change.before !== undefined ? formatDiffValue(change.before) : null;
  const afterValue = change.after !== undefined ? formatDiffValue(change.after) : null;

  return (
    <div className="border-b border-border/50 last:border-0">
      <div className="px-3 py-2 bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground">{change.property}</span>
      </div>
      <div className="divide-y divide-border/30">
        {change.type === "changed" && (
          <>
            {beforeValue && <DiffLine type="removed" value={beforeValue} />}
            {afterValue && <DiffLine type="added" value={afterValue} />}
          </>
        )}
        {change.type === "added" && afterValue && <DiffLine type="added" value={afterValue} />}
        {change.type === "removed" && beforeValue && (
          <DiffLine type="removed" value={beforeValue} />
        )}
      </div>
    </div>
  );
}

export function PropertyDiff({ changes }: PropertyDiffProps) {
  if (changes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No property changes detected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          Changes ({changes.length} {changes.length === 1 ? "property" : "properties"})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-b-lg overflow-hidden">
          {changes.map((change) => (
            <PropertyChangeItem key={change.property} change={change} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

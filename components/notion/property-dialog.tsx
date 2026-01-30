"use client";

import type { NotionPropertyType } from "@/lib/settings/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@/shared/ui";
import { useEffect, useState } from "react";

const TYPE_DISPLAY_NAMES: Record<string, string> = {
  title: "Title",
  date: "Date",
  rich_text: "Text",
  number: "Number",
  checkbox: "Checkbox",
  url: "URL",
  select: "Select",
};

export interface PropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "rename";
  fieldLabel: string;
  propertyType: NotionPropertyType;
  currentPropertyName?: string;
  onSuccess: (property: { id: string; name: string; type: string }) => void;
  onError?: (error: string) => void;
}

export function PropertyDialog({
  open,
  onOpenChange,
  mode,
  fieldLabel,
  propertyType,
  currentPropertyName,
  onSuccess,
  onError,
}: PropertyDialogProps) {
  const [propertyName, setPropertyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeDisplayName = TYPE_DISPLAY_NAMES[propertyType] || propertyType;
  const isRename = mode === "rename";

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPropertyName(currentPropertyName || "");
      setError(null);
    }
  }, [open, currentPropertyName]);

  const handleSubmit = async () => {
    if (!propertyName.trim()) return;
    if (isRename && !currentPropertyName) {
      const errorMessage = "Current property name is missing";
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isRename && currentPropertyName) {
        // Rename existing property
        const response = await fetch(
          `/api/setup/notion/property/${encodeURIComponent(currentPropertyName)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newName: propertyName.trim() }),
          },
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to rename property");
        }

        const data = await response.json();
        onSuccess(data.property);
      } else {
        // Create new property
        const response = await fetch("/api/setup/notion/property", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: propertyName.trim(),
            type: propertyType,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to create property");
        }

        const data = await response.json();
        onSuccess(data.property);
      }

      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Operation failed";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isRename ? "Rename Notion Property" : "Create Notion Property"}
          </DialogTitle>
          <DialogDescription>
            {isRename ? (
              <>
                Rename the <span className="font-medium">{typeDisplayName}</span> property for{" "}
                <span className="font-medium">{fieldLabel}</span>.
              </>
            ) : (
              <>
                Create a new <span className="font-medium">{typeDisplayName}</span> property in your
                Notion database for <span className="font-medium">{fieldLabel}</span>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="property-name">Property Name</Label>
            <Input
              id="property-name"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="Enter property name..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && propertyName.trim()) {
                  handleSubmit();
                }
              }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Type: <span className="font-medium">{typeDisplayName}</span>
            {!isRename && " (required for this field)"}
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !propertyName.trim() || (isRename && !currentPropertyName)}
          >
            {loading
              ? isRename
                ? "Renaming..."
                : "Creating..."
              : isRename
                ? "Rename Property"
                : "Create Property"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

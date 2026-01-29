"use client";

import { Button } from "@/shared/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNotionProperties } from "@/hooks/use-notion-properties";
import { useToast } from "@/lib/toast";

interface FieldMapping {
  title: string;
  date: string;
  description: string;
  location: string;
  gcalEventId: string;
  reminders: string;
}

interface NotionProperty {
  id: string;
  name: string;
  type: string;
}

interface FieldMappingEditorProps {
  initialMapping: FieldMapping | null;
  onSave?: () => void;
}

const FIELD_LABELS: Record<
  keyof FieldMapping,
  { label: string; description: string; required: boolean }
> = {
  title: {
    label: "Event Title",
    description: "The Notion property for event titles",
    required: true,
  },
  date: {
    label: "Event Date",
    description: "The Notion date property for event timing",
    required: true,
  },
  description: {
    label: "Description",
    description: "The Notion property for event descriptions",
    required: false,
  },
  location: {
    label: "Location",
    description: "The Notion property for event locations",
    required: false,
  },
  gcalEventId: {
    label: "GCal Event ID",
    description: "Property to store the Google Calendar event ID",
    required: false,
  },
  reminders: {
    label: "Reminders",
    description: "Property for reminder time in minutes",
    required: false,
  },
};

const EMPTY_VALUE = "__none__";

export function FieldMappingEditor({ initialMapping, onSave }: FieldMappingEditorProps) {
  const {
    properties,
    fieldMapping: loadedMapping,
    isLoading: loading,
    error: loadError,
    refresh,
  } = useNotionProperties("/api/settings/field-mapping");

  const { addToast } = useToast();
  const lastLoadError = useRef<string | null>(null);

  const [mapping, setMapping] = useState<FieldMapping>(
    initialMapping || {
      title: "Title",
      date: "Date",
      description: "",
      location: "",
      gcalEventId: "",
      reminders: "",
    },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!loadError) {
      lastLoadError.current = null;
      return;
    }
    const message =
      loadError instanceof Error ? loadError.message : "Failed to load Notion fields";
    if (lastLoadError.current === message) return;
    lastLoadError.current = message;
    addToast({
      title: "Unable to load Notion fields",
      description: message,
      variant: "destructive",
    });
  }, [loadError, addToast]);

  // Sync mapping state when data loads
  // Handle both simple FieldMapping and ExtendedFieldMapping formats
  useEffect(() => {
    if (loadedMapping) {
      const loaded = loadedMapping as Record<string, unknown>;
      // Check if it's ExtendedFieldMapping (has FieldConfig objects) or simple FieldMapping (has strings)
      const firstValue = loaded.title;
      if (typeof firstValue === "object" && firstValue !== null && "notionPropertyName" in firstValue) {
        // ExtendedFieldMapping format - extract notionPropertyName from each field
        const simpleMapping: FieldMapping = {
          title: (loaded.title as { notionPropertyName: string }).notionPropertyName || "",
          date: (loaded.date as { notionPropertyName: string }).notionPropertyName || "",
          description: (loaded.description as { notionPropertyName: string })?.notionPropertyName || "",
          location: (loaded.location as { notionPropertyName: string })?.notionPropertyName || "",
          gcalEventId: (loaded.gcalEventId as { notionPropertyName: string })?.notionPropertyName || "",
          reminders: (loaded.reminders as { notionPropertyName: string })?.notionPropertyName || "",
        };
        setMapping(simpleMapping);
      } else {
        // Simple FieldMapping format
        setMapping(loaded as unknown as FieldMapping);
      }
    }
  }, [loadedMapping]);

  const handleChange = (field: keyof FieldMapping, value: string) => {
    const actualValue = value === EMPTY_VALUE ? "" : value;
    setMapping((prev) => ({ ...prev, [field]: actualValue }));
    setHasChanges(true);
    setSuccess(false);
    setError(null);
  };

  // Get Notion properties already in use by other fields
  const getUsedNotionProperties = (currentField: keyof FieldMapping): Map<string, string> => {
    const used = new Map<string, string>();
    for (const [field, propName] of Object.entries(mapping)) {
      if (field === currentField || !propName) continue;
      const fieldInfo = FIELD_LABELS[field as keyof FieldMapping];
      if (fieldInfo) {
        used.set(propName, fieldInfo.label);
      }
    }
    return used;
  };

  const handleSave = async () => {
    if (!mapping.title || !mapping.date) {
      setError("Title and Date fields are required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/settings/field-mapping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapping),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save field mapping");
      }

      setSuccess(true);
      setHasChanges(false);
      onSave?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save field mapping");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Field Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Field Mapping</CardTitle>
        <CardDescription>
          Map Notion database properties to Google Calendar event fields
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Headers */}
        <div className="flex items-center justify-between py-4 px-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            <img
              src="/icons/google-calendar.png"
              alt="Google Calendar"
              className="w-7 h-7"
            />
            <span className="text-base font-medium">Google Calendar</span>
          </div>
          <div className="flex items-center gap-3">
            <img src="/icons/notion.png" alt="Notion" className="w-7 h-7" />
            <span className="text-base font-medium">Notion</span>
          </div>
        </div>

        <div className="space-y-4">
          {(Object.keys(FIELD_LABELS) as Array<keyof FieldMapping>).map((field) => {
            const { label, description, required } = FIELD_LABELS[field];
            const currentValue = mapping[field] || EMPTY_VALUE;
            const hasMissingCurrent =
              mapping[field] && !properties.find((p) => p.name === mapping[field]);
            const usedProperties = getUsedNotionProperties(field);

            return (
              <div key={field} className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
                <div>
                  <span className="text-sm font-medium">{label}</span>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <ArrowRight className="hidden md:block w-4 h-4 text-muted-foreground" />
                <div>
                  {properties.length > 0 ? (
                    <Select
                      value={currentValue}
                      onOpenChange={(open) => open && refresh()}
                      onValueChange={(val) => handleChange(field, val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property…" />
                      </SelectTrigger>
                      <SelectContent>
                        {hasMissingCurrent && (
                          <>
                            <SelectItem value={mapping[field]} disabled>
                              <span className="text-destructive">
                                {mapping[field]} <span className="text-xs">(missing)</span>
                              </span>
                            </SelectItem>
                            <SelectSeparator />
                          </>
                        )}
                        {!required && (
                          <SelectItem value={EMPTY_VALUE}>
                            <span className="text-muted-foreground">None</span>
                          </SelectItem>
                        )}
                        {properties.map((prop) => {
                          const usedByLabel = usedProperties.get(prop.name);
                          const isUsedElsewhere = usedByLabel !== undefined;

                          if (isUsedElsewhere) {
                            return (
                              <SelectItem
                                key={prop.id}
                                value={prop.name}
                                disabled
                                title={`Mapped to "${usedByLabel}". Remove that mapping first.`}
                              >
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span>{prop.name}</span>
                                  <span className="text-xs">(In use)</span>
                                </div>
                              </SelectItem>
                            );
                          }

                          return (
                            <SelectItem key={prop.id} value={prop.name}>
                              <div className="flex items-center gap-2">
                                <span>{prop.name}</span>
                                <span className="text-xs text-muted-foreground">({prop.type})</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <input
                      type="text"
                      value={mapping[field]}
                      onChange={(e) => handleChange(field, e.target.value)}
                      placeholder="Enter property name…"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        {success && (
          <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 text-sm text-foreground">
            Field mapping saved successfully
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

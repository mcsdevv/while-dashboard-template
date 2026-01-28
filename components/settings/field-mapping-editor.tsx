"use client";

import { Button } from "@/shared/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui";
import { useCallback, useEffect, useState } from "react";

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
  const [properties, setProperties] = useState<NotionProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadFieldMapping = useCallback(async () => {
    try {
      const response = await fetch("/api/settings/field-mapping");
      if (response.ok) {
        const data = await response.json();
        setMapping(data.mapping);
        setProperties(data.notionProperties || []);
      }
    } catch (err) {
      console.error("Failed to load field mapping:", err);
      setError("Failed to load field mapping");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFieldMapping();
  }, [loadFieldMapping]);

  const handleChange = (field: keyof FieldMapping, value: string) => {
    const actualValue = value === EMPTY_VALUE ? "" : value;
    setMapping((prev) => ({ ...prev, [field]: actualValue }));
    setHasChanges(true);
    setSuccess(false);
    setError(null);
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
        <div className="space-y-4">
          {(Object.keys(FIELD_LABELS) as Array<keyof FieldMapping>).map((field) => {
            const { label, description, required } = FIELD_LABELS[field];
            const currentValue = mapping[field] || EMPTY_VALUE;

            return (
              <div key={field} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{label}</span>
                    {required && <span className="text-xs text-destructive">*</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <div>
                  {properties.length > 0 ? (
                    <Select value={currentValue} onValueChange={(val) => handleChange(field, val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property…" />
                      </SelectTrigger>
                      <SelectContent>
                        {!required && (
                          <SelectItem value={EMPTY_VALUE}>
                            <span className="text-muted-foreground">None</span>
                          </SelectItem>
                        )}
                        {properties.map((prop) => (
                          <SelectItem key={prop.id} value={prop.name}>
                            <div className="flex items-center gap-2">
                              <span>{prop.name}</span>
                              <span className="text-xs text-muted-foreground">({prop.type})</span>
                            </div>
                          </SelectItem>
                        ))}
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

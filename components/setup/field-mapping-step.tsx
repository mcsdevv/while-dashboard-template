"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@/shared/ui";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { ExtendedFieldMapping, FieldConfig } from "@/lib/settings/types";
import { DEFAULT_EXTENDED_FIELD_MAPPING } from "@/lib/settings/types";

interface FieldMappingStepProps {
  onBack: () => void;
  onNext: () => void;
}

interface NotionProperty {
  id: string;
  name: string;
  type: string;
}

type FieldKey = keyof ExtendedFieldMapping;

const REQUIRED_FIELDS: FieldKey[] = ["title", "date"];
const OPTIONAL_FIELDS: FieldKey[] = [
  "description",
  "location",
  "gcalEventId",
  "reminders",
  "attendees",
  "organizer",
  "conferenceLink",
  "recurrence",
  "color",
  "visibility",
];

const FIELD_DESCRIPTIONS: Record<FieldKey, string> = {
  title: "The property containing the event title",
  date: "The date property for event timing",
  description: "Event description text",
  location: "Event location or address",
  gcalEventId: "Stores the Google Calendar event ID for syncing",
  reminders: "Reminder time in minutes before event",
  attendees: "List of event attendees",
  organizer: "Event organizer name",
  conferenceLink: "Video call link (Zoom, Meet, etc.)",
  recurrence: "Recurring event pattern",
  color: "Calendar color category",
  visibility: "Event visibility (public/private)",
};

const EMPTY_VALUE = "__none__";

export function FieldMappingStep({ onBack, onNext }: FieldMappingStepProps) {
  const [mapping, setMapping] = useState<ExtendedFieldMapping>(DEFAULT_EXTENDED_FIELD_MAPPING);
  const [properties, setProperties] = useState<NotionProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMapping() {
      try {
        const response = await fetch("/api/setup/field-mapping");
        if (response.ok) {
          const data = await response.json();
          setMapping(data.fieldMapping);
          setProperties(data.notionProperties || []);
        }
      } catch (err) {
        console.error("Failed to load field mapping:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMapping();
  }, []);

  const handleToggle = (field: FieldKey, enabled: boolean) => {
    setMapping((prev) => ({
      ...prev,
      [field]: { ...prev[field], enabled },
    }));
  };

  const handlePropertyChange = (field: FieldKey, propertyName: string) => {
    const actualValue = propertyName === EMPTY_VALUE ? "" : propertyName;
    setMapping((prev) => ({
      ...prev,
      [field]: { ...prev[field], notionPropertyName: actualValue },
    }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!mapping.title.notionPropertyName || !mapping.date.notionPropertyName) {
      setError("Title and Date fields require Notion property names");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/setup/field-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapping),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save field mapping");
      }

      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save field mapping");
    } finally {
      setSaving(false);
    }
  };

  const renderFieldRow = (field: FieldKey, config: FieldConfig) => {
    const isRequired = REQUIRED_FIELDS.includes(field);
    const currentValue = config.notionPropertyName || EMPTY_VALUE;

    return (
      <div key={field} className="flex items-center gap-4 py-2">
        {/* Toggle */}
        <div className="w-12 flex justify-center">
          <Switch
            checked={isRequired ? true : config.enabled}
            onCheckedChange={(checked) => handleToggle(field, checked)}
            disabled={isRequired}
          />
        </div>

        {/* Label and description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{config.displayLabel}</span>
            {isRequired && <span className="text-xs text-destructive">*</span>}
          </div>
          <p className="text-xs text-muted-foreground truncate">{FIELD_DESCRIPTIONS[field]}</p>
        </div>

        {/* Flow arrow */}
        <ArrowRight
          className={`w-4 h-4 flex-shrink-0 ${!isRequired && !config.enabled ? "text-muted-foreground/30" : "text-muted-foreground"}`}
        />

        {/* Property selector */}
        <div className="w-48">
          {properties.length > 0 ? (
            <Select
              value={currentValue}
              onValueChange={(val) => handlePropertyChange(field, val)}
              disabled={!isRequired && !config.enabled}
            >
              <SelectTrigger className={!isRequired && !config.enabled ? "opacity-50" : ""}>
                <SelectValue placeholder="Select property…" />
              </SelectTrigger>
              <SelectContent>
                {!isRequired && (
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
              value={config.notionPropertyName}
              onChange={(e) => handlePropertyChange(field, e.target.value)}
              disabled={!isRequired && !config.enabled}
              placeholder="Property name…"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Configure which Google Calendar fields sync to your Notion database. Toggle fields on/off
        and map them to your Notion properties.
      </div>

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

      {/* Required Fields Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Required Fields
        </h3>
        <div className="rounded-lg border border-input bg-background p-2">
          {REQUIRED_FIELDS.map((field) => renderFieldRow(field, mapping[field]))}
        </div>
      </div>

      {/* Optional Fields Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Optional Fields
        </h3>
        <div className="rounded-lg border border-input bg-background p-2">
          {OPTIONAL_FIELDS.map((field) => renderFieldRow(field, mapping[field]))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}

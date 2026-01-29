"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@/shared/ui";
import { ArrowRight, Pencil, Plus } from "lucide-react";
import { PropertyDialog } from "@/components/notion/property-dialog";
import { useEffect, useRef, useState } from "react";
import { useNotionProperties } from "@/hooks/use-notion-properties";
import { useToast } from "@/lib/toast";
import type { ExtendedFieldMapping, FieldConfig, NotionPropertyType } from "@/lib/settings/types";
import { DEFAULT_EXTENDED_FIELD_MAPPING } from "@/lib/settings/types";

interface FieldMappingStepProps {
  onBack: () => void;
  onNext: () => void;
}

interface NotionProperty {
  id: string;
  name: string;
  type: NotionPropertyType | string;
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

// Map each field to compatible Notion property types
const PROPERTY_TYPE_COMPATIBILITY: Record<FieldKey, NotionPropertyType[]> = {
  title: ["title"],
  date: ["date"],
  description: ["rich_text"],
  location: ["rich_text"],
  gcalEventId: ["rich_text"],
  reminders: ["number"],
  attendees: ["rich_text"],
  organizer: ["rich_text"],
  conferenceLink: ["url", "rich_text"],
  recurrence: ["rich_text"],
  color: ["select", "rich_text"],
  visibility: ["select", "rich_text"],
};

// Human-readable type names for the UI
const TYPE_DISPLAY_NAMES: Record<string, string> = {
  title: "Title",
  date: "Date",
  rich_text: "Text",
  number: "Number",
  checkbox: "Checkbox",
  url: "URL",
  select: "Select",
};

const EMPTY_VALUE = "__none__";
const CREATE_FIELD_VALUE = "__create__";
const RENAME_FIELD_VALUE = "__rename__";

export function FieldMappingStep({ onBack, onNext }: FieldMappingStepProps) {
  const {
    properties,
    fieldMapping: initialMapping,
    isLoading: loading,
    error: loadError,
    refresh,
  } = useNotionProperties("/api/setup/field-mapping");

  const { addToast } = useToast();
  const lastLoadError = useRef<string | null>(null);

  const [mapping, setMapping] = useState<ExtendedFieldMapping>(DEFAULT_EXTENDED_FIELD_MAPPING);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Property dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "rename">("create");
  const [dialogFieldFor, setDialogFieldFor] = useState<FieldKey | null>(null);

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

  // Sync mapping state when initial data loads
  useEffect(() => {
    if (initialMapping) {
      setMapping(initialMapping as ExtendedFieldMapping);
    }
  }, [initialMapping]);

  const isCompatiblePropertyType = (field: FieldKey, type: string) => {
    const compatibleTypes = PROPERTY_TYPE_COMPATIBILITY[field];
    return compatibleTypes.includes(type as NotionPropertyType);
  };

  // Get compatible properties for a field
  const getCompatibleProperties = (field: FieldKey): NotionProperty[] => {
    return properties.filter((prop) => isCompatiblePropertyType(field, prop.type));
  };

  // Open property dialog for create or rename
  const openPropertyDialog = (field: FieldKey, mode: "create" | "rename") => {
    setDialogFieldFor(field);
    setDialogMode(mode);
    setDialogOpen(true);
  };

  // Handle property dialog success
  const handlePropertyDialogSuccess = (property: { id: string; name: string; type: string }) => {
    if (!dialogFieldFor) return;

    // Update mapping to use the new/renamed property
    setMapping((prev) => ({
      ...prev,
      [dialogFieldFor]: {
        ...prev[dialogFieldFor],
        notionPropertyName: property.name,
        propertyType: property.type as NotionPropertyType,
      },
    }));

    setDialogOpen(false);
    setDialogFieldFor(null);
    void refresh();
  };

  const handleToggle = (field: FieldKey, enabled: boolean) => {
    setMapping((prev) => ({
      ...prev,
      [field]: { ...prev[field], enabled },
    }));
  };

  const handlePropertyChange = (
    field: FieldKey,
    propertyName: string,
    propertyType?: NotionPropertyType,
  ) => {
    const actualValue = propertyName === EMPTY_VALUE ? "" : propertyName;
    setMapping((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        notionPropertyName: actualValue,
        propertyType:
          propertyName === EMPTY_VALUE
            ? DEFAULT_EXTENDED_FIELD_MAPPING[field].propertyType
            : propertyType ?? prev[field].propertyType,
      },
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
      const ensureDefaultProperties = async (
        currentMapping: ExtendedFieldMapping,
      ): Promise<ExtendedFieldMapping> => {
        let updatedMapping = currentMapping;
        const createdProperties: NotionProperty[] = [];
        const knownProperties = [...properties];

        const fieldsToCheck = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
        for (const field of fieldsToCheck) {
          const config = updatedMapping[field];
          const isEnabled = REQUIRED_FIELDS.includes(field) || config.enabled;
          if (!isEnabled) continue;

          const defaultName = DEFAULT_EXTENDED_FIELD_MAPPING[field].notionPropertyName;
          if (!config.notionPropertyName || config.notionPropertyName !== defaultName) continue;

          const existing = knownProperties.find((prop) => prop.name === defaultName);
          if (existing) {
            if (!isCompatiblePropertyType(field, existing.type)) {
              const expectedLabel =
                TYPE_DISPLAY_NAMES[config.propertyType] || String(config.propertyType);
              const actualLabel = TYPE_DISPLAY_NAMES[existing.type] || String(existing.type);
              throw new Error(
                `"${defaultName}" exists as ${actualLabel}. Select a ${expectedLabel} property or rename it in Notion.`,
              );
            }

            if (existing.type !== config.propertyType) {
              updatedMapping = {
                ...updatedMapping,
                [field]: {
                  ...config,
                  propertyType: existing.type as NotionPropertyType,
                },
              };
            }

            continue;
          }

          const response = await fetch("/api/setup/notion/property", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: defaultName,
              type: config.propertyType,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Failed to create ${defaultName} property`);
          }

          const data = await response.json();
          const createdProperty = {
            id: data.property.id,
            name: data.property.name,
            type: data.property.type,
          };

          knownProperties.push(createdProperty);
          createdProperties.push(createdProperty);
          updatedMapping = {
            ...updatedMapping,
            [field]: {
              ...config,
              notionPropertyName: createdProperty.name,
              propertyType: createdProperty.type as NotionPropertyType,
            },
          };
        }

        if (createdProperties.length > 0) {
          await refresh();
        }

        if (updatedMapping !== currentMapping) {
          setMapping(updatedMapping);
        }

        return updatedMapping;
      };

      const mappingToSave = await ensureDefaultProperties(mapping);

      const response = await fetch("/api/setup/field-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mappingToSave),
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
    const compatibleProperties = getCompatibleProperties(field);
    const expectedType = config.propertyType;
    const typeDisplayName = TYPE_DISPLAY_NAMES[expectedType] || expectedType;
    const currentProperty = config.notionPropertyName
      ? properties.find((prop) => prop.name === config.notionPropertyName)
      : undefined;
    const hasMissingCurrent = Boolean(config.notionPropertyName && !currentProperty);
    const hasIncompatibleCurrent =
      currentProperty !== undefined && !isCompatiblePropertyType(field, currentProperty.type);

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
              onOpenChange={(open) => open && refresh()}
              onValueChange={(val) => {
                if (val === CREATE_FIELD_VALUE) {
                  openPropertyDialog(field, "create");
                } else if (val === RENAME_FIELD_VALUE) {
                  openPropertyDialog(field, "rename");
                } else {
                  const selectedProperty = properties.find((prop) => prop.name === val);
                  handlePropertyChange(
                    field,
                    val,
                    selectedProperty?.type as NotionPropertyType | undefined,
                  );
                }
              }}
              disabled={!isRequired && !config.enabled}
            >
              <SelectTrigger className={!isRequired && !config.enabled ? "opacity-50" : ""}>
                <SelectValue placeholder="Select property…" />
              </SelectTrigger>
              <SelectContent>
                {hasMissingCurrent && config.notionPropertyName && (
                  <>
                    <SelectItem value={config.notionPropertyName} disabled>
                      <div className="flex items-center gap-2 text-destructive">
                        <span>{config.notionPropertyName}</span>
                        <span className="text-xs">(missing in Notion)</span>
                      </div>
                    </SelectItem>
                    <SelectSeparator />
                  </>
                )}
                {hasIncompatibleCurrent && config.notionPropertyName && currentProperty && (
                  <>
                    <SelectItem value={config.notionPropertyName} disabled>
                      <div className="flex items-center gap-2 text-destructive">
                        <span>{config.notionPropertyName}</span>
                        <span className="text-xs">
                          (incompatible: {currentProperty.type})
                        </span>
                      </div>
                    </SelectItem>
                    <SelectSeparator />
                  </>
                )}
                {compatibleProperties.length > 0 ? (
                  compatibleProperties.map((prop) => (
                    <SelectItem key={prop.id} value={prop.name}>
                      <div className="flex items-center gap-2">
                        <span>{prop.name}</span>
                        <span className="text-xs text-muted-foreground">({prop.type})</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No {typeDisplayName.toLowerCase()} fields available
                  </div>
                )}
                <SelectSeparator />
                {field === "title" ? (
                  <SelectItem value={RENAME_FIELD_VALUE}>
                    <div className="flex items-center gap-2 text-primary">
                      <Pencil className="h-3 w-3" />
                      <span>Change field name...</span>
                    </div>
                  </SelectItem>
                ) : (
                  <SelectItem value={CREATE_FIELD_VALUE}>
                    <div className="flex items-center gap-2 text-primary">
                      <Plus className="h-3 w-3" />
                      <span>Create {typeDisplayName.toLowerCase()} field...</span>
                    </div>
                  </SelectItem>
                )}
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
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
        Warning: Default Notion property names are prefilled. If a field is toggled on and its
        default property doesn&apos;t exist yet, we&apos;ll create it in Notion before saving.
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

      {/* Property Dialog (Create or Rename) */}
      {dialogFieldFor && (
        <PropertyDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={dialogMode}
          fieldLabel={mapping[dialogFieldFor].displayLabel}
          propertyType={mapping[dialogFieldFor].propertyType}
          currentPropertyName={mapping[dialogFieldFor].notionPropertyName}
          onSuccess={handlePropertyDialogSuccess}
          onError={(err) => setError(err)}
        />
      )}
    </div>
  );
}

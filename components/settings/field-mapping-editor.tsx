"use client";

import { PropertyDialog } from "@/components/notion/property-dialog";
import { useNotionProperties } from "@/hooks/use-notion-properties";
import type { ExtendedFieldMapping, FieldConfig, NotionPropertyType } from "@/lib/settings/types";
import { DEFAULT_EXTENDED_FIELD_MAPPING } from "@/lib/settings/types";
import { useToast } from "@/lib/toast";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@/shared/ui";
import { ArrowRight, Pencil, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type FieldKey = keyof ExtendedFieldMapping;

interface NotionProperty {
  id: string;
  name: string;
  type: string;
}

interface FieldMappingEditorProps {
  initialMapping?: ExtendedFieldMapping | null;
  onSave?: () => void;
}

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

  const [mapping, setMapping] = useState<ExtendedFieldMapping>(
    initialMapping || DEFAULT_EXTENDED_FIELD_MAPPING,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Property dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "rename">("create");
  const [dialogFieldFor, setDialogFieldFor] = useState<FieldKey | null>(null);

  useEffect(() => {
    if (!loadError) {
      lastLoadError.current = null;
      return;
    }
    const message = loadError instanceof Error ? loadError.message : "Failed to load Notion fields";
    if (lastLoadError.current === message) return;
    lastLoadError.current = message;
    addToast({
      title: "Unable to load Notion fields",
      description: message,
      variant: "destructive",
    });
  }, [loadError, addToast]);

  // Sync mapping state when data loads
  useEffect(() => {
    if (loadedMapping) {
      setMapping(loadedMapping as ExtendedFieldMapping);
    }
  }, [loadedMapping]);

  const isCompatiblePropertyType = (field: FieldKey, type: string) => {
    const compatibleTypes = PROPERTY_TYPE_COMPATIBILITY[field];
    return compatibleTypes.includes(type as NotionPropertyType);
  };

  // Get compatible properties for a field
  const getCompatibleProperties = (field: FieldKey): NotionProperty[] => {
    return properties.filter((prop) => isCompatiblePropertyType(field, prop.type));
  };

  // Get Notion properties already in use by other enabled fields
  const getUsedNotionProperties = (currentField: FieldKey): Map<string, FieldKey> => {
    const used = new Map<string, FieldKey>();
    const allFields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

    for (const field of allFields) {
      if (field === currentField) continue;
      const config = mapping[field];
      const isEnabled = REQUIRED_FIELDS.includes(field) || config.enabled;
      if (isEnabled && config.notionPropertyName) {
        used.set(config.notionPropertyName, field);
      }
    }
    return used;
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
    setHasChanges(true);
    setSuccess(false);
    setError(null);
    void refresh();
  };

  const handleToggle = (field: FieldKey, enabled: boolean) => {
    setMapping((prev) => ({
      ...prev,
      [field]: { ...prev[field], enabled },
    }));
    setHasChanges(true);
    setSuccess(false);
    setError(null);
  };

  const handlePropertyChange = (
    field: FieldKey,
    propertyName: string,
    propertyType?: NotionPropertyType,
  ) => {
    const actualValue = propertyName === EMPTY_VALUE ? "" : propertyName;
    const normalizedValue = actualValue.trim();
    const isRequired = REQUIRED_FIELDS.includes(field);
    setMapping((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        notionPropertyName: normalizedValue,
        enabled: !isRequired && normalizedValue.length === 0 ? false : prev[field].enabled,
        propertyType:
          propertyName === EMPTY_VALUE
            ? DEFAULT_EXTENDED_FIELD_MAPPING[field].propertyType
            : (propertyType ?? prev[field].propertyType),
      },
    }));
    setHasChanges(true);
    setSuccess(false);
    setError(null);
  };

  const getMissingEnabledFieldLabels = (currentMapping: ExtendedFieldMapping) => {
    const fields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
    return fields
      .filter((field) => {
        const config = currentMapping[field];
        const isRequired = REQUIRED_FIELDS.includes(field) || config.required;
        const isEnabled = isRequired || config.enabled;
        return isEnabled && !config.notionPropertyName.trim();
      })
      .map((field) => currentMapping[field].displayLabel);
  };

  const handleSave = async () => {
    const missingFields = getMissingEnabledFieldLabels(mapping);
    if (missingFields.length > 0) {
      setError(`Enabled fields require Notion property names: ${missingFields.join(", ")}`);
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

  const renderFieldRow = (field: FieldKey, config: FieldConfig) => {
    const isRequired = REQUIRED_FIELDS.includes(field);
    const currentValue = config.notionPropertyName || EMPTY_VALUE;
    const compatibleProperties = getCompatibleProperties(field);
    const usedProperties = getUsedNotionProperties(field);
    const expectedType = config.propertyType;
    const typeDisplayName = TYPE_DISPLAY_NAMES[expectedType] || expectedType;
    const currentProperty = config.notionPropertyName
      ? properties.find((prop) => prop.name === config.notionPropertyName)
      : undefined;
    const hasMissingCurrent = Boolean(config.notionPropertyName && !currentProperty);
    const hasIncompatibleCurrent =
      currentProperty !== undefined && !isCompatiblePropertyType(field, currentProperty.type);

    return (
      <div key={field} className="flex items-center gap-4 py-3">
        {/* Toggle */}
        <div className="w-12 flex justify-center shrink-0">
          <Switch
            checked={isRequired ? true : config.enabled}
            onCheckedChange={(checked) => handleToggle(field, checked)}
            disabled={isRequired}
            aria-label={`Enable ${config.displayLabel}`}
          />
        </div>

        {/* Label and description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{config.displayLabel}</span>
            {isRequired && (
              <span className="text-xs text-destructive" aria-label="Required field">
                *
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{FIELD_DESCRIPTIONS[field]}</p>
        </div>

        {/* Flow arrow */}
        <ArrowRight
          className={`w-4 h-4 shrink-0 ${!isRequired && !config.enabled ? "text-muted-foreground/30" : "text-muted-foreground"}`}
          aria-hidden="true"
        />

        {/* Property selector */}
        <div className="w-48 shrink-0">
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
                <SelectValue placeholder="Select property..." />
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
                        <span className="text-xs">(incompatible: {currentProperty.type})</span>
                      </div>
                    </SelectItem>
                    <SelectSeparator />
                  </>
                )}
                {!isRequired && (
                  <SelectItem value={EMPTY_VALUE}>
                    <span className="text-muted-foreground">None</span>
                  </SelectItem>
                )}
                {compatibleProperties.length > 0 ? (
                  compatibleProperties.map((prop) => {
                    const usedByField = usedProperties.get(prop.name);
                    const isUsedElsewhere = usedByField !== undefined;

                    if (isUsedElsewhere) {
                      const usedByLabel = mapping[usedByField].displayLabel;
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
                  })
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
              placeholder="Property name..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            />
          )}
        </div>
      </div>
    );
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
            <img src="/icons/google-calendar.png" alt="Google Calendar" className="w-7 h-7" />
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
          <div
            className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 text-sm text-foreground"
            role="status"
            aria-live="polite"
          >
            Field mapping saved successfully
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>

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
    </Card>
  );
}

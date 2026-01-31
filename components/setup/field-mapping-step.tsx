"use client";

import { PropertyDialog } from "@/components/notion/property-dialog";
import { useNotionProperties } from "@/hooks/use-notion-properties";
import type { ExtendedFieldMapping, FieldConfig, NotionPropertyType } from "@/lib/settings/types";
import { DEFAULT_EXTENDED_FIELD_MAPPING } from "@/lib/settings/types";
import { useToast } from "@/lib/toast";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { StepHeader } from "./step-header";

interface FieldMappingStepProps {
  onBack: () => void;
  onNext: () => void;
  onDirtyStateChange?: (dirty: boolean) => void;
}

interface NotionProperty {
  id: string;
  name: string;
  type: NotionPropertyType | string;
}

type FieldKey = keyof ExtendedFieldMapping;
type PendingCreation = { field: FieldKey; propertyName: string; propertyType: string };
type PendingConflict = {
  field: FieldKey;
  propertyName: string;
  expectedType: string;
  actualType: string;
};

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

export function FieldMappingStep({ onBack, onNext, onDirtyStateChange }: FieldMappingStepProps) {
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Property dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "rename">("create");
  const [dialogFieldFor, setDialogFieldFor] = useState<FieldKey | null>(null);

  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogError, setConfirmDialogError] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<{
    toCreate: PendingCreation[];
    conflicts: PendingConflict[];
  }>({ toCreate: [], conflicts: [] });
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

  // Sync mapping state when initial data loads
  useEffect(() => {
    if (initialMapping) {
      setMapping(initialMapping as ExtendedFieldMapping);
    }
  }, [initialMapping]);

  // Notify parent when dirty state changes
  useEffect(() => {
    onDirtyStateChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyStateChange]);

  const isCompatiblePropertyType = (field: FieldKey, type: string) => {
    const compatibleTypes = PROPERTY_TYPE_COMPATIBILITY[field];
    return compatibleTypes.includes(type as NotionPropertyType);
  };

  const formatConflictSummary = (conflicts: PendingConflict[]) =>
    conflicts
      .map(
        (conflict) =>
          `${conflict.propertyName} (found ${conflict.actualType}, expected ${conflict.expectedType})`,
      )
      .join("; ");

  const buildDefaultPropertyPlan = (
    currentMapping: ExtendedFieldMapping,
    currentProperties: NotionProperty[],
  ) => {
    let updatedMapping = currentMapping;
    const toCreate: PendingCreation[] = [];
    const conflicts: PendingConflict[] = [];

    const fieldsToCheck = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
    for (const field of fieldsToCheck) {
      const config = updatedMapping[field];
      const isEnabled = REQUIRED_FIELDS.includes(field) || config.enabled;
      if (!isEnabled) continue;

      const defaultName = DEFAULT_EXTENDED_FIELD_MAPPING[field].notionPropertyName;
      // Only auto-create properties when user keeps the default name.
      // If user cleared it or chose a different name, skip auto-creation.
      if (!config.notionPropertyName || config.notionPropertyName !== defaultName) continue;

      // Check if property already exists in Notion
      const existing = currentProperties.find((prop) => prop.name === defaultName);
      if (existing) {
        if (!isCompatiblePropertyType(field, existing.type)) {
          const expectedType =
            TYPE_DISPLAY_NAMES[config.propertyType] || String(config.propertyType);
          const actualType = TYPE_DISPLAY_NAMES[existing.type] || String(existing.type);
          conflicts.push({
            field,
            propertyName: defaultName,
            expectedType,
            actualType,
          });
          continue;
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

      const typeDisplayName = TYPE_DISPLAY_NAMES[config.propertyType] || config.propertyType;
      toCreate.push({
        field,
        propertyName: defaultName,
        propertyType: typeDisplayName,
      });
    }

    return { toCreate, conflicts, updatedMapping };
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
    setHasUnsavedChanges(true);

    setDialogOpen(false);
    setDialogFieldFor(null);
    void refresh();
  };

  const handleToggle = (field: FieldKey, enabled: boolean) => {
    setMapping((prev) => ({
      ...prev,
      [field]: { ...prev[field], enabled },
    }));
    setHasUnsavedChanges(true);
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
        enabled:
          !isRequired && normalizedValue.length === 0 ? false : prev[field].enabled,
        propertyType:
          propertyName === EMPTY_VALUE
            ? DEFAULT_EXTENDED_FIELD_MAPPING[field].propertyType
            : (propertyType ?? prev[field].propertyType),
      },
    }));
    setHasUnsavedChanges(true);
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

  const handleSave = () => {
    // Block if Notion properties couldn't be loaded
    if (properties.length === 0) {
      setError(
        "Unable to load Notion properties. Please complete the Notion setup first (step 3), then return to this step.",
      );
      return;
    }

    const missingFields = getMissingEnabledFieldLabels(mapping);
    if (missingFields.length > 0) {
      setError(`Enabled fields require Notion property names: ${missingFields.join(", ")}`);
      return;
    }

    // Calculate what changes will be made
    const plan = buildDefaultPropertyPlan(mapping, properties);

    if (plan.conflicts.length > 0) {
      setError(
        "Some default Notion properties already exist with incompatible types. Resolve them before continuing.",
      );
    } else {
      setError(null);
    }

    if (plan.conflicts.length > 0 || plan.toCreate.length > 0) {
      // Show confirmation dialog
      setPendingChanges({ toCreate: plan.toCreate, conflicts: plan.conflicts });
      setConfirmDialogError(null);
      setConfirmDialogOpen(true);
      return;
    }

    // No properties to create or conflicts to resolve, proceed directly
    performSave();
  };

  const performSave = async (): Promise<boolean> => {
    setSaving(true);
    setError(null);
    setConfirmDialogError(null);

    try {
      const ensureDefaultProperties = async (
        currentMapping: ExtendedFieldMapping,
      ): Promise<ExtendedFieldMapping> => {
        let updatedMapping = currentMapping;
        const createdProperties: NotionProperty[] = [];
        const knownProperties = [...properties];

        const plan = buildDefaultPropertyPlan(updatedMapping, knownProperties);

        if (plan.conflicts.length > 0) {
          const summary = formatConflictSummary(plan.conflicts);
          throw new Error(
            `Cannot continue because these Notion properties already exist with incompatible types: ${summary}. Rename them in Notion or select compatible properties.`,
          );
        }

        updatedMapping = plan.updatedMapping;

        for (const change of plan.toCreate) {
          const config = updatedMapping[change.field];
          const response = await fetch("/api/setup/notion/property", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: change.propertyName,
              type: config.propertyType,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Failed to create ${change.propertyName} property`);
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
            [change.field]: {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save field mapping");
      }

      // Show warning toast if storage not configured
      if (data.warning) {
        addToast({
          title: "Warning",
          description: data.warning,
          variant: "destructive",
        });
      }

      setHasUnsavedChanges(false);
      onNext();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save field mapping";
      setError(errorMessage);
      setConfirmDialogError(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSave = async () => {
    const success = await performSave();
    if (success) {
      setConfirmDialogOpen(false);
      setConfirmDialogError(null);
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
                        <span className="text-xs">(incompatible: {currentProperty.type})</span>
                      </div>
                    </SelectItem>
                    <SelectSeparator />
                  </>
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
      <StepHeader
        title="Mapping"
        description="Configure how properties sync between Notion and Google Calendar."
      />
      <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
        <div className="flex items-start gap-2">
          <svg
            aria-hidden="true"
            className="h-5 w-5 text-amber-600 shrink-0 mt-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            <span className="font-medium text-amber-700 dark:text-amber-500">Warning:</span> Default
            Notion property names are prefilled. If a field is toggled on and its default property
            doesn&apos;t exist yet, we&apos;ll create it in Notion before saving.
          </p>
        </div>
      </div>

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
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Notion Changes</DialogTitle>
            <DialogDescription>
              {pendingChanges.conflicts.length > 0
                ? "Some default property names already exist in your Notion database with incompatible types. This happens because default field names require specific Notion property types."
                : "The following properties will be created in your Notion database."}
            </DialogDescription>
          </DialogHeader>
          {confirmDialogError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {confirmDialogError}
            </div>
          )}
          <div className="py-4 space-y-4">
            {pendingChanges.conflicts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">
                  Incompatible existing properties
                </p>
                <ul className="space-y-2">
                  {pendingChanges.conflicts.map(
                    ({ field, propertyName, expectedType, actualType }) => (
                      <li
                        key={field}
                        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{propertyName}</span>
                          <span className="text-xs text-destructive">
                            Expected {expectedType}, found {actualType}
                          </span>
                        </div>
                      </li>
                    ),
                  )}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Rename these properties in Notion or choose a compatible property in the dropdown
                  to continue.
                </p>
              </div>
            )}
            {pendingChanges.toCreate.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Properties to be created
                </p>
                <ul className="space-y-2">
                  {pendingChanges.toCreate.map(({ field, propertyName, propertyType }) => (
                    <li
                      key={field}
                      className="flex items-center justify-between text-sm rounded-md bg-muted/50 px-3 py-2"
                    >
                      <span className="font-medium">{propertyName}</span>
                      <span className="text-xs text-muted-foreground">{propertyType}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={saving || pendingChanges.conflicts.length > 0}
            >
              {pendingChanges.conflicts.length > 0 ? "Resolve issues" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

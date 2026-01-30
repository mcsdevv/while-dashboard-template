"use client";

import { FieldMappingEditor } from "@/components/settings/field-mapping-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from "@/shared/ui";
import { useCallback, useEffect, useState } from "react";

interface FieldMapping {
  title: string;
  date: string;
  description: string;
  location: string;
  gcalEventId: string;
  reminders: string;
}

export default function FieldMappingPage() {
  const [mapping, setMapping] = useState<FieldMapping | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMapping = useCallback(async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setMapping(data.fieldMapping);
      }
    } catch (error) {
      console.error("Error fetching field mapping:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapping();
  }, [fetchMapping]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Field Mapping</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure how Notion properties map to Google Calendar fields
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Field mapping defines how data flows between your Notion database and Google Calendar.
            Each Notion property can be mapped to a corresponding calendar field. Changes are
            synchronized bidirectionally.
          </CardDescription>
        </CardContent>
      </Card>

      {/* Field Mapping Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Property Mappings</CardTitle>
          <CardDescription>
            Select which Notion properties to use for each calendar field
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldMappingEditor initialMapping={mapping} onSave={fetchMapping} />
        </CardContent>
      </Card>
    </div>
  );
}

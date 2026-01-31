"use client";

import { FieldMappingEditor } from "@/components/settings/field-mapping-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";

export default function FieldMappingPage() {
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
      <FieldMappingEditor />
    </div>
  );
}

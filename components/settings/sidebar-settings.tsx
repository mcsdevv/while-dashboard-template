"use client";

import { useSidebarVisibility } from "@/components/shell/sidebar-visibility-context";
import { navigation } from "@/lib/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Switch } from "@/shared/ui";
import { PanelLeft } from "lucide-react";

export function SidebarSettings() {
  const { isVisible, setItemVisibility } = useSidebarVisibility();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PanelLeft className="h-4 w-4" />
          Sidebar
        </CardTitle>
        <CardDescription>Choose which items appear in the sidebar navigation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {navigation
          .filter((item) => item.id !== "settings")
          .map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 px-1 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{item.title}</span>
                </div>
                <Switch
                  checked={isVisible(item.id)}
                  onCheckedChange={(checked) => setItemVisibility(item.id, checked)}
                />
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
}

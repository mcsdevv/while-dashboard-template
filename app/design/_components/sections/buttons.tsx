import { Button } from "@/shared/ui";
import { Download, Loader2, Mail, Plus } from "lucide-react";
import { ComponentSection, ComponentRow } from "../component-section";

export function ButtonsSection() {
  return (
    <ComponentSection id="buttons" title="BUTTON_VARIANTS" description="Interactive button states and sizes">
      <ComponentRow label="VARIANTS">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </ComponentRow>

      <ComponentRow label="SIZES">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon"><Plus className="h-4 w-4" /></Button>
      </ComponentRow>

      <ComponentRow label="WITH_ICONS">
        <Button><Mail className="mr-2 h-4 w-4" />Login with Email</Button>
        <Button variant="outline"><Download className="mr-2 h-4 w-4" />Export</Button>
      </ComponentRow>

      <ComponentRow label="STATES">
        <Button disabled>Disabled</Button>
        <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing</Button>
      </ComponentRow>
    </ComponentSection>
  );
}

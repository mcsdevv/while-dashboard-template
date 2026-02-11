import { Badge } from "@/shared/ui";
import { ComponentSection, ComponentRow } from "../component-section";

export function BadgesSection() {
  return (
    <ComponentSection id="badges" title="BADGE_VARIANTS" description="Status indicators and labels">
      <ComponentRow label="VARIANTS">
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Error</Badge>
        <Badge variant="success">Active</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="terminal">ACT</Badge>
      </ComponentRow>

      <ComponentRow label="SIZES">
        <Badge size="default">Default</Badge>
        <Badge size="fixed">Fixed Width</Badge>
      </ComponentRow>

      <ComponentRow label="TERMINAL_STATUS">
        <Badge variant="terminal">RUNNING</Badge>
        <Badge variant="terminal">CONVERGING</Badge>
        <Badge variant="terminal">IDLE</Badge>
        <Badge variant="terminal">FLT.32</Badge>
      </ComponentRow>
    </ComponentSection>
  );
}

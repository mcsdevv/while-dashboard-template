import { ComponentSection, ComponentGrid } from "../component-section";

const colorTokens = [
  { name: "BACKGROUND", var: "--background", class: "bg-background" },
  { name: "FOREGROUND", var: "--foreground", class: "bg-foreground" },
  { name: "CARD", var: "--card", class: "bg-card" },
  { name: "PRIMARY", var: "--primary", class: "bg-primary" },
  { name: "SECONDARY", var: "--secondary", class: "bg-secondary" },
  { name: "MUTED", var: "--muted", class: "bg-muted" },
  { name: "ACCENT", var: "--accent", class: "bg-accent" },
  { name: "DESTRUCTIVE", var: "--destructive", class: "bg-destructive" },
  { name: "BORDER", var: "--border", class: "bg-border" },
  { name: "INPUT", var: "--input", class: "bg-input" },
  { name: "RING", var: "--ring", class: "bg-ring" },
  { name: "POPOVER", var: "--popover", class: "bg-popover" },
] as const;

const chartTokens = [
  { name: "CHART_1", class: "bg-chart-1" },
  { name: "CHART_2", class: "bg-chart-2" },
  { name: "CHART_3", class: "bg-chart-3" },
  { name: "CHART_4", class: "bg-chart-4" },
  { name: "CHART_5", class: "bg-chart-5" },
] as const;

function ColorSwatch({
  name,
  className,
}: {
  name: string;
  className: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-10 w-10 border border-border ${className}`}
      />
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {name}
      </span>
    </div>
  );
}

export function ColorsSection() {
  return (
    <ComponentSection id="colors" title="COLOR_PALETTE" description="Semantic color tokens">
      <ComponentGrid cols={3} label="SEMANTIC_COLORS">
        {colorTokens.map((token) => (
          <ColorSwatch key={token.name} name={token.name} className={token.class} />
        ))}
      </ComponentGrid>
      <ComponentGrid cols={3} label="CHART_COLORS">
        {chartTokens.map((token) => (
          <ColorSwatch key={token.name} name={token.name} className={token.class} />
        ))}
      </ComponentGrid>
    </ComponentSection>
  );
}

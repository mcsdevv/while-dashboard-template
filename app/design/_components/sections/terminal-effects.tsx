import { ComponentSection, ComponentGrid } from "../component-section";

export function TerminalEffectsSection() {
  return (
    <ComponentSection id="terminal" title="TERMINAL_EFFECTS" description="Decorative terminal utilities">
      <ComponentGrid cols={2}>
        <div className="space-y-2">
          <p className="terminal-label">CORNER_DECORATIONS</p>
          <div className="terminal-corners border border-border p-6">
            <p className="text-[13px] text-muted-foreground">
              Panel with corner bracket decorations
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="terminal-label">GRID_BACKGROUND</p>
          <div className="terminal-grid-bg border border-border p-6 h-[100px]" />
        </div>

        <div className="space-y-2">
          <p className="terminal-label">SCANLINES</p>
          <div className="relative border border-border p-6 h-[100px] bg-card">
            <div className="terminal-scanlines absolute inset-0" />
            <p className="relative text-[13px] text-muted-foreground">
              CRT scanline overlay effect
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="terminal-label">TERMINAL_LABELS</p>
          <div className="border border-border p-6 space-y-3">
            <div className="flex justify-between">
              <span className="terminal-label">SYS</span>
              <span className="text-[13px]">NEURAL_ENG</span>
            </div>
            <div className="flex justify-between">
              <span className="terminal-label">CPU</span>
              <span className="text-[13px]">12%</span>
            </div>
            <div className="flex justify-between">
              <span className="terminal-label">MEM</span>
              <span className="text-[13px]">4.2GB</span>
            </div>
          </div>
        </div>
      </ComponentGrid>
    </ComponentSection>
  );
}

import { ComponentSection } from "../component-section";

export function TypographySection() {
  return (
    <ComponentSection id="typography" title="TYPOGRAPHY" description="Geist Mono type scale">
      <div className="space-y-4">
        <div className="border-b border-border pb-4">
          <p className="terminal-label mb-2">HEADING_LG</p>
          <h1 className="text-3xl font-semibold tracking-tight">SYSTEM_ONLINE</h1>
        </div>
        <div className="border-b border-border pb-4">
          <p className="terminal-label mb-2">HEADING_MD</p>
          <h2 className="text-2xl font-semibold tracking-tight">Neural Engine v4.2</h2>
        </div>
        <div className="border-b border-border pb-4">
          <p className="terminal-label mb-2">HEADING_SM</p>
          <h3 className="text-xl font-medium">Performance Metrics</h3>
        </div>
        <div className="border-b border-border pb-4">
          <p className="terminal-label mb-2">BODY</p>
          <p className="text-[13px]">
            The optimizer is converging on the target loss function. Current
            learning rate: 0.045, momentum: 128, batch size: 64.
          </p>
        </div>
        <div className="border-b border-border pb-4">
          <p className="terminal-label mb-2">LABEL</p>
          <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            WEIGHT_HASH
          </span>
        </div>
        <div className="border-b border-border pb-4">
          <p className="terminal-label mb-2">MUTED</p>
          <p className="text-[13px] text-muted-foreground">
            Last sync: 2 minutes ago. Next scheduled sync in 13 minutes.
          </p>
        </div>
        <div>
          <p className="terminal-label mb-2">CODE / MONOSPACE</p>
          <code className="text-[13px] bg-muted px-2 py-1 border border-border">
            0xA8 0x14 [ACT]
          </code>
        </div>
      </div>
    </ComponentSection>
  );
}

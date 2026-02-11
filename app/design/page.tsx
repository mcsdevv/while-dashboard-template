"use client";

import { ColorsSection } from "./_components/sections/colors";
import { TypographySection } from "./_components/sections/typography";
import { ButtonsSection } from "./_components/sections/buttons";
import { BadgesSection } from "./_components/sections/badges";
import { FormsSection } from "./_components/sections/forms";
import { CardsSection } from "./_components/sections/cards";
import { TablesSection } from "./_components/sections/tables";
import { DialogsSection } from "./_components/sections/dialogs";
import { OverlaysSection } from "./_components/sections/overlays";
import { FeedbackSection } from "./_components/sections/feedback";
import { TerminalEffectsSection } from "./_components/sections/terminal-effects";
import { NavigationSection } from "./_components/sections/navigation";
import { DataDisplaySection } from "./_components/sections/data-display";
import { LayoutComponentsSection } from "./_components/sections/layout-components";

const sections = [
  { id: "colors", label: "COLORS" },
  { id: "typography", label: "TYPE" },
  { id: "buttons", label: "BUTTONS" },
  { id: "badges", label: "BADGES" },
  { id: "forms", label: "FORMS" },
  { id: "cards", label: "CARDS" },
  { id: "tables", label: "TABLES" },
  { id: "navigation", label: "NAV" },
  { id: "data-display", label: "DATA" },
  { id: "dialogs", label: "DIALOGS" },
  { id: "overlays", label: "OVERLAYS" },
  { id: "feedback", label: "FEEDBACK" },
  { id: "layout", label: "LAYOUT" },
  { id: "terminal", label: "TERMINAL" },
];

export default function DesignPage() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <nav className="sticky top-0 hidden h-screen w-48 shrink-0 border-r border-border p-4 lg:block">
        <div className="mb-6">
          <p className="terminal-label">SYS</p>
          <p className="text-[13px] font-medium">DESIGN_SYSTEM</p>
          <p className="terminal-label mt-1">v1.35.0</p>
        </div>
        <div className="space-y-1">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="block px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground transition-colors duration-100 hover:text-foreground"
            >
              {section.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 space-y-8 p-6 lg:p-8">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <div className="flex items-baseline gap-4">
            <span className="terminal-label">SYS</span>
            <h1 className="text-lg font-medium tracking-tight">DESIGN_SYSTEM</h1>
            <span className="terminal-label">v1.35.0</span>
          </div>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Terminal-aesthetic component library built on Base UI primitives
          </p>
        </div>

        {/* Sections */}
        <ColorsSection />
        <TypographySection />
        <ButtonsSection />
        <BadgesSection />
        <FormsSection />
        <CardsSection />
        <TablesSection />
        <NavigationSection />
        <DataDisplaySection />
        <DialogsSection />
        <OverlaysSection />
        <FeedbackSection />
        <LayoutComponentsSection />
        <TerminalEffectsSection />
      </main>
    </div>
  );
}

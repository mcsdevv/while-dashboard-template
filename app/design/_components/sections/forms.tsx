"use client";

import { Button, Input, Label, Switch } from "@/shared/ui";
import { ComponentSection, ComponentGrid, ComponentRow } from "../component-section";

export function FormsSection() {
  return (
    <ComponentSection id="forms" title="FORM_CONTROLS" description="Input elements and form fields">
      <ComponentGrid cols={2} label="TEXT_INPUT">
        <div className="space-y-2">
          <Label htmlFor="email">EMAIL_ADDRESS</Label>
          <Input id="email" type="email" placeholder="operator@neural.sys" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">ACCESS_KEY</Label>
          <Input id="password" type="password" placeholder="••••••••" />
        </div>
      </ComponentGrid>

      <ComponentRow label="INPUT_STATES">
        <Input placeholder="Default input" className="max-w-[200px]" />
        <Input placeholder="Disabled" disabled className="max-w-[200px]" />
        <Input placeholder="With value" defaultValue="0xA8F3" className="max-w-[200px]" />
      </ComponentRow>

      <ComponentRow label="SWITCH_CONTROL">
        <div className="flex items-center gap-3">
          <Switch id="auto-sync" />
          <Label htmlFor="auto-sync">AUTO_SYNC</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch id="monitoring" defaultChecked />
          <Label htmlFor="monitoring">MONITORING</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch id="disabled" disabled />
          <Label htmlFor="disabled">DISABLED</Label>
        </div>
      </ComponentRow>

      <div>
        <p className="terminal-label mb-3">FORM_EXAMPLE</p>
        <div className="max-w-md space-y-4 border border-border p-4">
          <div className="space-y-2">
            <Label htmlFor="endpoint">ENDPOINT_URL</Label>
            <Input id="endpoint" placeholder="https://api.neural.sys/v4" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="token">AUTH_TOKEN</Label>
            <Input id="token" type="password" placeholder="Bearer token" />
          </div>
          <div className="flex items-center gap-3">
            <Switch id="verify" />
            <Label htmlFor="verify">VERIFY_SSL</Label>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Test</Button>
            <Button>Connect</Button>
          </div>
        </div>
      </div>
    </ComponentSection>
  );
}

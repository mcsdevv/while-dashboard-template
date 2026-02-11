"use client";

import {
  Avatar,
  AvatarFallback,
  Progress,
  Spinner,
  Slider,
  Checkbox,
  Label,
  RadioGroup,
  RadioGroupItem,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Kbd,
} from "@/shared/ui";
import { Bold, Italic, Underline } from "lucide-react";
import { ComponentSection, ComponentRow, ComponentGrid } from "../component-section";

export function DataDisplaySection() {
  return (
    <ComponentSection id="data-display" title="DATA_DISPLAY" description="Avatars, progress, sliders, and interactive controls">
      <ComponentGrid cols={3} label="AVATAR">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>NE</AvatarFallback>
          </Avatar>
          <span className="text-[13px]">SM</span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>SY</AvatarFallback>
          </Avatar>
          <span className="text-[13px]">DEFAULT</span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <span className="text-[13px]">LG</span>
        </div>
      </ComponentGrid>

      <ComponentGrid cols={2} label="PROGRESS">
        <div className="space-y-2">
          <p className="terminal-label">TRAINING // 45%</p>
          <Progress value={45} />
        </div>
        <div className="space-y-2">
          <p className="terminal-label">SYNC // 78%</p>
          <Progress value={78} />
        </div>
      </ComponentGrid>

      <ComponentRow label="SLIDER">
        <div className="w-full max-w-sm space-y-2">
          <p className="terminal-label">LEARNING_RATE</p>
          <Slider defaultValue={[50]} max={100} step={1} />
        </div>
      </ComponentRow>

      <ComponentRow label="SPINNER">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Spinner size="sm" />
            <span className="text-[13px]">SM</span>
          </div>
          <div className="flex items-center gap-2">
            <Spinner />
            <span className="text-[13px]">DEFAULT</span>
          </div>
          <div className="flex items-center gap-2">
            <Spinner size="lg" />
            <span className="text-[13px]">LG</span>
          </div>
        </div>
      </ComponentRow>

      <ComponentGrid cols={2} label="CHECKBOX">
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" defaultChecked />
          <Label htmlFor="terms">ENABLE_LOGGING</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="debug" />
          <Label htmlFor="debug">DEBUG_MODE</Label>
        </div>
      </ComponentGrid>

      <ComponentRow label="RADIO_GROUP">
        <RadioGroup defaultValue="gpu">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cpu" id="cpu" />
            <Label htmlFor="cpu">CPU</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="gpu" id="gpu" />
            <Label htmlFor="gpu">GPU</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="tpu" id="tpu" />
            <Label htmlFor="tpu">TPU</Label>
          </div>
        </RadioGroup>
      </ComponentRow>

      <ComponentRow label="TOGGLE">
        <div className="flex items-center gap-2">
          <Toggle aria-label="Toggle bold" variant="outline">
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle aria-label="Toggle italic" variant="outline">
            <Italic className="h-4 w-4" />
          </Toggle>
        </div>
      </ComponentRow>

      <ComponentRow label="TOGGLE_GROUP">
        <ToggleGroup>
          <ToggleGroupItem value="bold" aria-label="Toggle bold" variant="outline">
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Toggle italic" variant="outline">
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Toggle underline" variant="outline">
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </ComponentRow>

      <ComponentRow label="KBD">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </div>
          <span className="text-[13px] text-muted-foreground">Command palette</span>
          <div className="flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>⇧</Kbd>
            <Kbd>P</Kbd>
          </div>
          <span className="text-[13px] text-muted-foreground">Quick actions</span>
        </div>
      </ComponentRow>
    </ComponentSection>
  );
}

"use client";

import { PreviewCard } from "@base-ui/react/preview-card";
import * as React from "react";

import { cn } from "./utils";

const HoverCard = PreviewCard.Root;

const HoverCardTrigger = PreviewCard.Trigger;

interface HoverCardContentProps extends React.ComponentPropsWithoutRef<typeof PreviewCard.Popup> {
  sideOffset?: number;
  align?: "start" | "center" | "end";
}

const HoverCardContent = React.forwardRef<HTMLDivElement, HoverCardContentProps>(
  ({ className, sideOffset = 4, align = "center", ...props }, ref) => (
    <PreviewCard.Portal>
      <PreviewCard.Positioner sideOffset={sideOffset} align={align}>
        <PreviewCard.Popup
          ref={ref}
          className={cn(
            "z-50 w-64 rounded-none border bg-popover p-4 text-popover-foreground shadow-md outline-none origin-[var(--transform-origin)]",
            "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
            "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
            "transition-[transform,opacity] duration-100",
            className,
          )}
          {...props}
        />
      </PreviewCard.Positioner>
    </PreviewCard.Portal>
  ),
);
HoverCardContent.displayName = "HoverCardContent";

export { HoverCard, HoverCardTrigger, HoverCardContent };

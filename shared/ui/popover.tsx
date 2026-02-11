"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import * as React from "react";

import { cn } from "./utils";

const Popover = BasePopover.Root;

const PopoverTrigger = BasePopover.Trigger;

const PopoverClose = BasePopover.Close;

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BasePopover.Popup> & {
    sideOffset?: number;
    align?: "start" | "center" | "end";
  }
>(({ className, sideOffset = 4, align = "center", children, ...props }, ref) => (
  <BasePopover.Portal>
    <BasePopover.Positioner sideOffset={sideOffset} align={align}>
      <BasePopover.Popup
        ref={ref}
        className={cn(
          "z-50 w-72 rounded-none border border-border bg-background p-4 text-[13px] text-foreground shadow-md outline-none",
          "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
          "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
          "transition-[transform,opacity] duration-100",
          className,
        )}
        {...props}
      >
        {children}
      </BasePopover.Popup>
    </BasePopover.Positioner>
  </BasePopover.Portal>
));
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent, PopoverClose };

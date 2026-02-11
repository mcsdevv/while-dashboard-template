"use client";

import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import * as React from "react";

import { cn } from "./utils";

const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseScrollArea.Root>
>(({ className, children, ...props }, ref) => (
  <BaseScrollArea.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <BaseScrollArea.Viewport className="h-full w-full">
      <BaseScrollArea.Content>{children}</BaseScrollArea.Content>
    </BaseScrollArea.Viewport>
    <ScrollAreaScrollbar orientation="vertical" />
    <ScrollAreaScrollbar orientation="horizontal" />
    <BaseScrollArea.Corner />
  </BaseScrollArea.Root>
));
ScrollArea.displayName = "ScrollArea";

const ScrollAreaScrollbar = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseScrollArea.Scrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <BaseScrollArea.Scrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none rounded-none transition-opacity duration-100",
      orientation === "vertical" && "h-full w-2 border-l border-l-transparent p-px",
      orientation === "horizontal" && "h-2 flex-col border-t border-t-transparent p-px",
      className,
    )}
    {...props}
  >
    <BaseScrollArea.Thumb className="relative flex-1 rounded-none bg-border" />
  </BaseScrollArea.Scrollbar>
));
ScrollAreaScrollbar.displayName = "ScrollAreaScrollbar";

export { ScrollArea, ScrollAreaScrollbar };

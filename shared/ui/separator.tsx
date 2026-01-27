"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import * as React from "react";

import { cn } from "./utils";

export interface SeparatorProps extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <SeparatorPrimitive
      ref={ref}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = "Separator";

export { Separator };

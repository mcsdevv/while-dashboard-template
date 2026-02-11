"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import * as React from "react";

import { cn } from "./utils";

const Slider = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseSlider.Root>
>(({ className, ...props }, ref) => (
  <BaseSlider.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none flex-col items-center", className)}
    {...props}
  >
    <BaseSlider.Control className="flex w-full items-center py-2">
      <BaseSlider.Track className="relative h-1 w-full rounded-none bg-secondary">
        <BaseSlider.Indicator className="absolute h-full rounded-none bg-foreground" />
        <BaseSlider.Thumb className="block h-3.5 w-3.5 cursor-pointer rounded-full border border-border bg-foreground shadow transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
      </BaseSlider.Track>
    </BaseSlider.Control>
  </BaseSlider.Root>
));
Slider.displayName = "Slider";

export { Slider };

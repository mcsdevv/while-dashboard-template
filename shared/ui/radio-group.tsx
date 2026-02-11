"use client";

import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import * as React from "react";

import { cn } from "./utils";

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseRadioGroup>
>(({ className, ...props }, ref) => (
  <BaseRadioGroup
    ref={ref}
    className={cn("grid gap-2", className)}
    {...props}
  />
));
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<typeof BaseRadio.Root>
>(({ className, ...props }, ref) => (
  <BaseRadio.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-none border border-border bg-transparent text-[13px] transition-colors duration-100",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[checked]:bg-foreground data-[checked]:text-background",
      className,
    )}
    {...props}
  >
    <BaseRadio.Indicator className="flex items-center justify-center">
      <span className="block h-1.5 w-1.5 rounded-none bg-current" />
    </BaseRadio.Indicator>
  </BaseRadio.Root>
));
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };

"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";
import * as React from "react";

import { cn } from "./utils";

const Checkbox = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof BaseCheckbox.Root>
>(({ className, ...props }, ref) => (
  <BaseCheckbox.Root
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
    <BaseCheckbox.Indicator className="flex items-center justify-center">
      <Check className="h-3 w-3" />
    </BaseCheckbox.Indicator>
  </BaseCheckbox.Root>
));
Checkbox.displayName = "Checkbox";

export { Checkbox };

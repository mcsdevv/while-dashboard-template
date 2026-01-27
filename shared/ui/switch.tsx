"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import * as React from "react";
import { cn } from "./utils";

export interface SwitchProps
  extends Omit<React.ComponentPropsWithoutRef<typeof BaseSwitch.Root>, "children"> {
  /** Additional class names for the switch root */
  className?: string;
  /** Additional class names for the thumb */
  thumbClassName?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, thumbClassName, ...props }, ref) => {
    return (
      <BaseSwitch.Root
        ref={ref}
        className={cn(
          "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[checked]:bg-foreground data-[unchecked]:bg-input",
          className,
        )}
        {...props}
      >
        <BaseSwitch.Thumb
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
            "data-[checked]:translate-x-4 data-[unchecked]:translate-x-0",
            thumbClassName,
          )}
        />
      </BaseSwitch.Root>
    );
  },
);
Switch.displayName = "Switch";

export { Switch };

"use client";

import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import * as React from "react";
import { type VariantProps, tv } from "tailwind-variants";

import { cn } from "./utils";

const toggleVariants = tv({
  base: "inline-flex cursor-pointer items-center justify-center gap-2 rounded-none text-[13px] font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[pressed]:bg-accent data-[pressed]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  variants: {
    variant: {
      default: "bg-transparent hover:bg-accent hover:text-accent-foreground",
      outline:
        "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
    },
    size: {
      default: "h-9 min-w-9 px-3",
      sm: "h-8 min-w-8 px-2",
      lg: "h-10 min-w-10 px-3",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

const Toggle = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof BaseToggle> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <BaseToggle
    ref={ref}
    className={cn(toggleVariants({ variant, size }), className)}
    {...props}
  />
));
Toggle.displayName = "Toggle";

export { Toggle, toggleVariants };

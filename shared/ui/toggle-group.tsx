"use client";

import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import * as React from "react";
import { type VariantProps } from "tailwind-variants";

import { cn } from "./utils";
import { toggleVariants } from "./toggle";

const ToggleGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseToggleGroup>
>(({ className, ...props }, ref) => (
  <BaseToggleGroup
    ref={ref}
    className={cn("flex items-center gap-1", className)}
    {...props}
  />
));
ToggleGroup.displayName = "ToggleGroup";

const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof BaseToggle> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <BaseToggle
    ref={ref}
    className={cn(toggleVariants({ variant, size }), className)}
    {...props}
  />
));
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };

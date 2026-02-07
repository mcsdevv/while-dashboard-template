"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";

import { cn } from "./utils";

// Wrapper to provide Radix-compatible onValueChange signature
interface SelectProps extends Omit<
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>,
  "onValueChange"
> {
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ onValueChange, onOpenChange, ...props }, ref) => (
    <SelectPrimitive.Root
      {...props}
      onValueChange={onValueChange ? (value) => onValueChange(value as string) : undefined}
      onOpenChange={onOpenChange}
    />
  ),
);
Select.displayName = "Select";

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-pointer h-9 w-full items-center justify-between whitespace-nowrap rounded-none border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon className="flex items-center">
      <ChevronDown aria-hidden="true" className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectScrollUpButton = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpArrow>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpArrow
    ref={ref}
    className={cn("flex cursor-pointer items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp aria-hidden="true" className="h-4 w-4" />
  </SelectPrimitive.ScrollUpArrow>
));
SelectScrollUpButton.displayName = "SelectScrollUpButton";

const SelectScrollDownButton = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownArrow>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownArrow
    ref={ref}
    className={cn("flex cursor-pointer items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown aria-hidden="true" className="h-4 w-4" />
  </SelectPrimitive.ScrollDownArrow>
));
SelectScrollDownButton.displayName = "SelectScrollDownButton";

interface SelectContentProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Popup> {
  position?: "popper" | "item-aligned";
  sideOffset?: number;
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, position = "popper", sideOffset = 4, ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner sideOffset={sideOffset}>
        <SelectPrimitive.Popup
          ref={ref}
          className={cn(
            "relative z-50 max-h-[var(--available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-none border bg-popover! text-popover-foreground shadow-md origin-[var(--transform-origin)]",
            "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
            "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
            "transition-[transform,opacity] duration-150",
            position === "popper" &&
              "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List
            className={cn(
              "p-1",
              position === "popper" &&
                "h-[var(--trigger-height)] w-full min-w-[var(--anchor-width)]",
            )}
          >
            {children}
          </SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  ),
);
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.GroupLabel>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.GroupLabel
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-none py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check aria-hidden="true" className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
  ),
);
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};

"use client";

import * as React from "react";

import { cn } from "./utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  // oxlint-disable-next-line jsx_a11y/label-has-associated-control -- Consumers attach htmlFor or wrap inputs.
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };

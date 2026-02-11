import * as React from "react";
import { type VariantProps, tv } from "tailwind-variants";

import { cn } from "./utils";

const spinnerVariants = tv({
  base: "inline-block animate-spin rounded-none border-current border-t-transparent",
  variants: {
    size: {
      sm: "h-4 w-4 border",
      default: "h-6 w-6 border-2",
      lg: "h-8 w-8 border-2",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof spinnerVariants> {}

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size, ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      aria-label="Loading"
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </span>
  ),
);
Spinner.displayName = "Spinner";

export { Spinner, spinnerVariants };

"use client";

import { RefreshCw } from "lucide-react";
import * as React from "react";
import { Button, type ButtonProps } from "./button";

export interface RefreshButtonProps extends Omit<ButtonProps, "children"> {
  /** Whether the refresh action is in progress */
  loading?: boolean;
  /** Button label (default: "Refresh") */
  label?: string;
}

const RefreshButton = React.forwardRef<HTMLButtonElement, RefreshButtonProps>(
  ({ loading = false, label = "Refresh", disabled, ...props }, ref) => {
    return (
      <Button ref={ref} variant="outline" size="sm" disabled={disabled || loading} {...props}>
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
        {label}
      </Button>
    );
  },
);
RefreshButton.displayName = "RefreshButton";

export { RefreshButton };

"use client";

import * as React from "react";

export interface AutoRefreshToggleProps {
  /** Whether auto-refresh is enabled */
  checked: boolean;
  /** Callback when the toggle state changes */
  onCheckedChange: (checked: boolean) => void;
  /** Refresh interval in seconds (default: 30) */
  intervalSeconds?: number;
  /** Additional className for the label */
  className?: string;
}

const AutoRefreshToggle = React.forwardRef<HTMLLabelElement, AutoRefreshToggleProps>(
  ({ checked, onCheckedChange, intervalSeconds = 30, className = "" }, ref) => {
    return (
      <label
        ref={ref}
        className={`flex items-center gap-2 text-sm text-muted-foreground cursor-pointer ${className}`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="rounded border-input"
        />
        Auto-refresh ({intervalSeconds}s)
      </label>
    );
  },
);
AutoRefreshToggle.displayName = "AutoRefreshToggle";

export { AutoRefreshToggle };

"use client";

import { Progress as BaseProgress } from "@base-ui/react/progress";
import * as React from "react";

import { cn } from "./utils";

const Progress = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseProgress.Root> & {
    showValue?: boolean;
  }
>(({ className, showValue = false, ...props }, ref) => (
  <BaseProgress.Root
    ref={ref}
    className={cn("flex w-full flex-col gap-1 text-[13px]", className)}
    {...props}
  >
    {showValue && (
      <div className="flex justify-between text-[13px] text-muted-foreground">
        <BaseProgress.Label>Progress</BaseProgress.Label>
        <BaseProgress.Value />
      </div>
    )}
    <BaseProgress.Track className="h-1.5 w-full rounded-none bg-secondary">
      <BaseProgress.Indicator className="h-full rounded-none bg-foreground transition-[width] duration-100" />
    </BaseProgress.Track>
  </BaseProgress.Root>
));
Progress.displayName = "Progress";

export { Progress };

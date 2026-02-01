import type * as React from "react";
import { type VariantProps, tv } from "tailwind-variants";

const badgeVariants = tv({
  base: "inline-flex items-center justify-center rounded-none border px-4 py-1.5 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  variants: {
    variant: {
      default: "border-transparent bg-foreground text-background hover:bg-foreground/80",
      secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive: "border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10",
      success:
        "border border-emerald-500/30 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10",
      warning: "border border-amber-500/30 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10",
      outline: "text-foreground border-foreground/20",
    },
    size: {
      default: "",
      fixed: "min-w-[5rem]",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={badgeVariants({ variant, size, class: className })} {...props} />;
}

export { Badge, badgeVariants };

import type * as React from "react";
import { type VariantProps, tv } from "tailwind-variants";

const badgeVariants = tv({
  base: "inline-flex items-center rounded-none border px-2.5 py-0.5 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  variants: {
    variant: {
      default: "border-transparent bg-foreground text-background hover:bg-foreground/80",
      secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive:
        "border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10",
      success:
        "border border-emerald-500/30 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10",
      warning: "border border-foreground/20 bg-foreground/5 text-foreground hover:bg-foreground/10",
      outline: "text-foreground border-foreground/20",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={badgeVariants({ variant, class: className })} {...props} />;
}

export { Badge, badgeVariants };

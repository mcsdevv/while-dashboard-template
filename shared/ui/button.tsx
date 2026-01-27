import { useRender } from "@base-ui/react/use-render";
import { tv, type VariantProps } from "tailwind-variants";
import * as React from "react";

const buttonVariants = tv({
  base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-normal transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  variants: {
    variant: {
      default: "bg-foreground text-background shadow hover:bg-foreground/90",
      destructive:
        "border border-foreground/20 bg-background text-foreground shadow-sm hover:bg-foreground/5",
      outline:
        "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-foreground underline underline-offset-4",
    },
    size: {
      default: "h-9 px-4 py-2",
      sm: "h-8 px-3 text-xs",
      lg: "h-10 px-8",
      icon: "h-9 w-9",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Render the button as a different element using the render prop pattern.
   * Example: <Button render={<Link href="/contact" />}>Contact</Button>
   */
  render?: React.ReactElement;
  /**
   * @deprecated Use the `render` prop instead.
   * Example: Instead of <Button asChild><Link href="/">Click</Link></Button>
   * Use: <Button render={<Link href="/" />}>Click</Button>
   */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, render, asChild = false, children, ...props }, ref) => {
    const mergedClassName = buttonVariants({ variant, size, class: className });

    // If render prop is provided, use Base UI's useRender
    if (render) {
      return useRender({
        render,
        props: { ...props, ref, className: mergedClassName, children },
      });
    }

    // Legacy asChild support - extract child element and merge props
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<Record<string, unknown>>;
      const childClassName = child.props.className as string | undefined;
      return React.cloneElement(child, {
        ...props,
        ref,
        className: childClassName ? `${mergedClassName} ${childClassName}` : mergedClassName,
      });
    }

    return (
      <button className={mergedClassName} ref={ref} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

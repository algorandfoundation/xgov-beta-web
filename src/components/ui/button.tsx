import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "src/functions/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-slate-300",
  {
    variants: {
      variant: {
        default:
          "bg-algo-blue text-white border border-algo-blue hover:bg-white hover:text-algo-blue dark:bg-algo-teal dark:text-algo-black dark:border-algo-teal dark:hover:bg-algo-black dark:hover:text-algo-teal",
        destructive:
          "group flex items-center gap-2 bg-algo-red text-white border border-algo-red hover:bg-white hover:text-algo-red dark:hover:text-algo-red dark:hover:bg-algo-black",
        success:
          "group flex items-center gap-2 bg-algo-green text-white border border-algo-green hover:bg-white hover:text-algo-green dark:hover:bg-algo-black hover:border-algo-green transition",
        outline:
          "border border-algo-blue bg-white hover:bg-algo-blue text-algo-blue hover:text-white dark:border-algo-teal dark:bg-algo-black dark:hover:bg-algo-teal dark:text-algo-teal dark:hover:text-algo-black",
        secondary:
          "bg-algo-black-20 text-slate-900 hover:bg-algo-black-20/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80",
        ghost:
          "hover:bg-white hover:text-slate-900 dark:text-algo-black-20 dark:hover:bg-algo-black dark:hover:text-slate-50",
        link: "text-slate-900 underline-offset-4 hover:underline dark:text-slate-50 focus-visible:ring-0 dark:focus-visible:ring-0 focus-visible:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs: 'h-6 rounded-md p-1 text-xs',
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

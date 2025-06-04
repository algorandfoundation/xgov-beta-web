import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "src/functions/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const buttonVariants = cva(
  "flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-slate-300",
  {
    variants: {
      variant: {
        default:
          "bg-white dark:bg-algo-black text-lg rounded-md text-algo-black dark:text-white p-2 px-4 border border-white dark:border-algo-black hover:bg-algo-blue hover:bg-opacity-80 hover:text-white  dark:hover:bg-algo-teal dark:hover:bg-opacity-80 dark:hover:text-algo-black",
        destructive:
          "bg-algo-red text-slate-50 shadow-sm hover:bg-algo-red/90 dark:bg-algo-red dark:text-slate-50 dark:hover:bg-algo-red/90",
        outline:
          "border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-transparent dark:hover:bg-slate-800 dark:hover:text-slate-50",
        secondary:
          "bg-algo-blue dark:bg-algo-teal text-lg rounded-md text-white dark:text-algo-black p-2 px-4 border border-algo-blue dark:border-algo-teal hover:bg-white hover:bg-opacity-80 hover:text-algo-blue  dark:hover:bg-algo-black dark:hover:bg-opacity-80 dark:hover:text-algo-teal",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        link: "text-slate-900 underline-offset-4 hover:underline dark:text-slate-50",
      },
      size: {
        default: "h-9 px-4 py-2",
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

const ringVariants = cva("", {
  variants: {
    variant: {
      default: "border-white dark:border-algo-black",
      destructive: "",
      outline: "",
      secondary: "border-algo-blue dark:border-algo-teal",
      ghost: "",
      link: "",
    },
    size: {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      icon: "size-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

interface RingProps extends VariantProps<typeof ringVariants> {
  index: number;
  rings: number;
}

const Ring = ({ index, variant, rings }: RingProps) => (
  <div
    className={cn(
      "absolute inset-0 transition-all duration-200 pointer-events-none",
      "opacity-0 group-hover:opacity-100",
    )}
    style={{
      translate: `-${(index + 1) * 4}% ${(index + 1) * 12}%`,
      transitionDelay: `${(index + 1) * 100}ms`,
    }}
  >
    <div
      className={cn(
        ringVariants({ variant }),
        "w-full h-full rounded-md border",
      )}
      style={{
        opacity: 1 - (index + 1) / rings + 0.05,
      }}
    ></div>
  </div>
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  rings?: number;
  disabledMessage?: string;
}

const InfinityMirrorButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      rings = 4,
      disabled,
      disabledMessage,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="group relative">
              {!disabled &&
                Array.from({ length: rings }).map((_, i) => (
                  <Ring key={i} index={i} variant={variant} rings={rings} />
                ))}
              <Comp
                className={cn(
                  buttonVariants({ variant, size, className }),
                  "relative z-10",
                )}
                ref={ref}
                disabled={disabled}
                {...props}
              />
            </div>
          </TooltipTrigger>
          {disabled && (
            <TooltipContent>
              <p className="text-lg">{disabledMessage}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  },
);
InfinityMirrorButton.displayName = "Button";

export { InfinityMirrorButton, buttonVariants };

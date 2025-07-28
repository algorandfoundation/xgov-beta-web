import { cn } from "@/functions";
import { cva, type VariantProps } from "class-variance-authority";

const parentSpinnerVariants = cva(
  'flex justify-center items-center',
  {
    variants: {
      size: {
        default: 'py-8',
        xs: 'py-2',
        sm: 'py-4',
      },
    },
    defaultVariants: {
      size: 'default',
    },  
  }
)

const spinnerVariants = cva(
  'animate-spin border-t-transparent dark:border-t-transparent group-hover:border-t-transparent rounded-full',
  {
    variants: {
      variant: {
        default: 'border-algo-blue dark:border-algo-teal group-hover:border-white group-hover:dark:border-algo-black',
        secondary: 'border-white dark:border-algo-black group-hover:border-algo-blue group-hover:dark:border-algo-teal',
      },
      size: {
        default: 'h-8 w-8 border-4',
        xs: 'h-3 w-3 border-2',
        sm: 'h-6 w-6 border-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
};

export function LoadingSpinner({ variant, size, className }: LoadingSpinnerProps) {
  return (
    <div className={cn(className, parentSpinnerVariants({ size }))}>
      <div className={spinnerVariants({ variant, size })}></div>
    </div>
  );
}

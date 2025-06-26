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
  'animate-spin border-algo-blue dark:border-algo-teal border-t-transparent dark:border-t-transparent rounded-full',
  {
    variants: {
      size: {
        default: 'h-8 w-8 border-4',
        xs: 'h-3 w-3 border-2',
        sm: 'h-6 w-6 border-2',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export function LoadingSpinner({ size }: VariantProps<typeof spinnerVariants>) {
  return (
    <div className={parentSpinnerVariants({ size })}>
      <div className={spinnerVariants({ size })}></div>
    </div>
  );
}

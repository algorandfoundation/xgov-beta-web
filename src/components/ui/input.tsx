import * as React from "react"

import { cn } from "src/functions/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-algo-blue-50 dark:border-algo-teal-20/30 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium text-algo-black dark:text-algo-black-10 placeholder:text-algo-black-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-algo-blue-50 dark:focus-visible:ring-algo-teal-50 disabled:cursor-not-allowed disabled:opacity-50 ",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

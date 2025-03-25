import { cn } from "@/functions/utils"
import * as React from "react"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-algo-blue-50 dark:border-algo-teal-20/30 bg-transparent px-3 py-2 text-base shadow-sm text-algo-black dark:text-algo-black-10 placeholder:text-algo-black-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-algo-blue-50 dark:focus-visible:ring-algo-teal-50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

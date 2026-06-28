import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand/10 text-brand",
        secondary:
          "border-border-default bg-elevated text-copy-secondary",
        outline:
          "border-border-default text-copy-secondary",
        ai:
          "border-transparent bg-ai/10 text-ai-text",
        success:
          "border-transparent bg-green/10 text-green",
        warning:
          "border-transparent bg-warning-dim text-warning",
        destructive:
          "border-transparent bg-error/10 text-error",
        ghost:
          "border-transparent bg-subtle text-copy-muted",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

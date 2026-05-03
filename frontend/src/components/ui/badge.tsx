import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-white",
        outline: "border-border text-foreground",
        accent: "border-transparent bg-[var(--accent-glow)] text-[var(--accent-light)] border border-[rgba(124,106,247,0.3)]",
        amber: "border-transparent bg-[var(--amber-dim)] text-[var(--amber)] border border-[rgba(251,191,36,0.25)]",
        green: "border-transparent bg-[var(--green-dim)] text-[var(--green)] border border-[rgba(74,222,128,0.25)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface SiteLogoProps {
  /** Link target — defaults to "/" */
  href?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Visual emphasis for dark backgrounds */
  withGlow?: boolean;
  className?: string;
}

/**
 * Ghost AI brand mark with animated gradient orb.
 * Single source of truth for the brand mark across the marketing site,
 * editor chrome, and auth screens.
 */
export function SiteLogo({
  href = "/",
  size = "md",
  withGlow = true,
  className,
}: SiteLogoProps) {
  const sizeMap = {
    sm: { wrap: "h-7 w-7", icon: "h-3.5 w-3.5", text: "text-sm" },
    md: { wrap: "h-9 w-9", icon: "h-4 w-4", text: "text-base" },
    lg: { wrap: "h-12 w-12", icon: "h-5 w-5", text: "text-xl" },
  } as const;

  const s = sizeMap[size];

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 font-semibold tracking-tight text-copy-primary transition-opacity hover:opacity-90",
        className
      )}
    >
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-xl",
          "bg-gradient-to-br from-brand via-brand/90 to-ai",
          "shadow-lg shadow-brand/20 ring-1 ring-white/10",
          s.wrap
        )}
      >
        {withGlow && (
          <span
            className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-brand to-ai opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-50"
            aria-hidden
          />
        )}
        <Sparkles className={cn("text-white", s.icon)} />
      </span>
      <span className={cn("font-semibold", s.text)}>Ghost AI</span>
    </Link>
  );
}

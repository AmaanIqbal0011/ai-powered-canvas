import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a string to a URL-safe slug: lowercase, hyphens for spaces,
 * strip non-alphanumeric (except hyphens), deduplicate hyphens, trim
 * leading/trailing hyphens, capped at 64 characters.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

/**
 * Generate a short random suffix (6 characters) for ephemeral room IDs.
 */
export function shortId(): string {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Format a date as a short relative-time label.
 *
 * - Same day → "Today"
 * - 1 day ago → "Yesterday"
 * - < 30 days → "Nd ago"
 * - Otherwise → localized "Mon D" (e.g. "Mar 14")
 *
 * Safe to call with a `Date.now()`-derived timestamp. Use
 * `useNow()` from your component to avoid SSR hydration mismatches.
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days < 2) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Format a date as a localized calendar label.
 *
 * Example: "Mar 14, 2026". Used in card footers and timestamps.
 */
export function formatExactDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

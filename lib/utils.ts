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

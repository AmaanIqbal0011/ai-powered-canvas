"use client";

import {
  ArrowRight,
  Layers,
  Sparkles,
  UserPlus,
  Wand2,
} from "lucide-react";

import { SiteLogo } from "@/components/site/site-logo";
import { cn } from "@/lib/utils";

interface AuthPanelProps {
  /** Heading shown at the top of the marketing panel */
  title?: string;
  /** Short tagline displayed under the heading */
  tagline?: string;
  /** Highlight stat shown at the bottom */
  highlight?: { label: string; value: string };
  className?: string;
}

/**
 * Marketing panel displayed on the left side of the Sign In / Sign Up pages.
 *
 * - Animated radial gradient + grid background
 * - Brand mark + tagline + 4-step feature highlights
 * - Decorative floating product preview
 *
 * Hidden on small screens (`hidden md:flex`) — the mobile layout stacks
 * the Clerk form full-width above this panel.
 */
export function AuthPanel({
  title = "Design systems your team will actually ship",
  tagline = "Ghost AI is the collaborative canvas where architecture starts as a prompt and ends as a downloadable spec.",
  highlight,
  className,
}: AuthPanelProps) {
  return (
    <aside
      className={cn(
        "relative isolate hidden flex-1 overflow-hidden border-r border-border-default/60 bg-base md:flex md:flex-col",
        className
      )}
    >
      {/* ── Decorative background ── */}
      <div className="bg-spotlight pointer-events-none absolute inset-0 opacity-90" />
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[480px] -translate-x-1/2 rounded-full bg-brand/30 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-[420px] rounded-full bg-ai/30 blur-[120px]" />

      {/* ── Content ── */}
      <div className="relative flex flex-1 flex-col px-10 py-12 lg:px-14 lg:py-14">
        <SiteLogo size="md" />

        <div className="my-auto flex max-w-md flex-col gap-6 py-10">
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-copy-primary lg:text-[34px]">
            {title}
          </h1>
          <p className="text-balance text-sm leading-relaxed text-copy-secondary lg:text-base">
            {tagline}
          </p>

          <ul className="flex flex-col gap-3 pt-2">
            {[
              {
                icon: Wand2,
                title: "AI drafts your architecture",
                body: "Plain-English prompts become a complete canvas of nodes and edges.",
              },
              {
                icon: UserPlus,
                title: "Invite the whole team",
                body: "Real-time presence, live cursors, and instant multi-user editing.",
              },
              {
                icon: Layers,
                title: "Six canonical shapes",
                body: "Services, databases, gateways, events — all represented.",
              },
              {
                icon: Sparkles,
                title: "Exportable specs",
                body: "Ship a Markdown technical spec in one click.",
              },
            ].map((item, i) => (
              <li
                key={item.title}
                className="group flex items-start gap-3 rounded-xl border border-border-default/60 bg-elevated/40 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-border-subtle hover:bg-elevated hover:shadow-lg hover:shadow-brand/5"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand/20 to-ai/20 ring-1 ring-white/5">
                  <item.icon className="h-4 w-4 text-brand" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-copy-primary">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-copy-muted">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Bottom row: highlight + CTA hint ── */}
        <div className="flex flex-col gap-4">
          {highlight && (
            <div className="flex items-center justify-between rounded-2xl border border-brand/30 bg-brand-dim/50 px-4 py-3 backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-wider text-brand">
                  {highlight.label}
                </p>
                <p className="mt-0.5 text-xl font-semibold tracking-tight text-copy-primary">
                  {highlight.value}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 ring-1 ring-brand/30">
                <ArrowRight className="h-4 w-4 text-brand" />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-copy-muted">
            <p>© {new Date().getFullYear()} Ghost AI</p>
            <p>Made for engineering teams</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

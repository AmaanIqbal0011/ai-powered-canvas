"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock,
  Compass,
  Folder,
  Network,
  Plus,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjectDialog } from "@/context/project-dialog-context";
import type { ProjectListItem } from "@/lib/project-data";
import { formatExactDate, formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface EditorDashboardProps {
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
  currentUserName: string | null;
  currentUserId: string;
}

/**
 * Returns the current time once on the client (post-mount) so relative
 * date labels don't trigger an SSR hydration mismatch.
 *
 * Falls back to a stable reference timestamp during initial render so the
 * server-emitted HTML matches the first client render. After hydration, the
 * `now` value updates and components re-render with the real value.
 */
function useNow(): number {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);
  return now ?? 0;
}

/**
 * Premium dashboard for the editor home route.
 *
 * Shown when no project is selected — replaces the bare "create or open"
 * greeting with a fully designed workspace overview:
 * - Personalized greeting with primary "New project" CTA
 * - Stats ribbon (owned, shared, recent activity, starter templates)
 * - Project grid with hover overlays and action menus
 * - Starter templates row
 */
export function EditorDashboard({
  ownedProjects,
  sharedProjects,
  currentUserName,
  currentUserId,
}: EditorDashboardProps) {
  const { openCreate } = useProjectDialog();
  const now = useNow();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return "Working late";
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const stats = useMemo(() => {
    const recent = now
      ? ownedProjects.filter(
          (p) => now - new Date(p.updatedAt).getTime() < 1000 * 60 * 60 * 24 * 7
        ).length
      : 0;

    return [
      {
        icon: Folder,
        label: "Owned",
        value: ownedProjects.length,
        hint: "projects you own",
      },
      {
        icon: Users,
        label: "Shared",
        value: sharedProjects.length,
        hint: "with your team",
      },
      {
        icon: Clock,
        label: "Active",
        value: recent,
        hint: "in the last 7 days",
      },
      {
        icon: Sparkles,
        label: "Starter",
        value: "3+",
        hint: "ready-to-import",
      },
    ];
  }, [ownedProjects, sharedProjects, now]);

  const hasProjects = ownedProjects.length + sharedProjects.length > 0;

  return (
    <div className="relative flex h-full w-full flex-col overflow-y-auto bg-base">
      <div className="bg-spotlight pointer-events-none absolute inset-0 -z-10 opacity-60" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:py-14">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className="text-[11px] uppercase tracking-wider">
              <Compass className="h-3 w-3" />
              Workspace
            </Badge>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-copy-primary sm:text-4xl">
              {greeting}
              {currentUserName && (
                <span className="text-gradient-brand">
                  , {currentUserName.split(/[^a-zA-Z0-9]/)[0]}
                </span>
              )}
              .
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-copy-secondary sm:text-base">
              Start a new architecture, jump back into a recent canvas, or
              import a pre-built template.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Button
              onClick={openCreate}
              size="lg"
              className="group gap-2 shadow-lg shadow-brand/25 ring-1 ring-white/10"
            >
              <Plus className="h-4 w-4" />
              New project
              <ArrowRight className="h-4 w-4 opacity-0 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="#templates">
                <Sparkles className="h-4 w-4 text-brand" />
                Browse templates
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-2xl border border-border-default bg-elevated/40 p-4 inset-stroke transition-all duration-300 hover:-translate-y-0.5 hover:border-border-subtle hover:bg-elevated"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand/15 to-ai/15 ring-1 ring-white/5">
                  <s.icon className="h-4 w-4 text-brand" />
                </span>
                <span className="text-[10px] uppercase tracking-wider text-copy-faint">
                  {s.label}
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-copy-primary">
                {s.value}
              </p>
              <p className="text-xs text-copy-muted">{s.hint}</p>
            </div>
          ))}
        </section>

        {hasProjects && (
          <section className="space-y-5">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-copy-primary">
                  Your projects
                </h2>
                <p className="text-sm text-copy-muted">
                  Owned and recently shared workspaces.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={openCreate}
                className="text-copy-secondary hover:text-copy-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Create
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ownedProjects.slice(0, 6).map((p) => (
                <ProjectCard
                  key={p.id}
                  title={p.name}
                  href={`/editor/${p.id}`}
                  updatedAt={p.updatedAt}
                  isOwner
                  isShared={false}
                  hasNow={now > 0}
                />
              ))}
              {sharedProjects.slice(0, 3).map((p) => (
                <ProjectCard
                  key={p.id}
                  title={p.name}
                  href={`/editor/${p.id}`}
                  updatedAt={p.updatedAt}
                  isOwner={p.ownerId === currentUserId}
                  isShared
                  hasNow={now > 0}
                />
              ))}
            </div>
          </section>
        )}

        {!hasProjects && <EmptyState onCreate={openCreate} />}

        <section id="templates" className="space-y-5 pt-4">
          <div className="flex items-end justify-between">
            <div>
              <Badge variant="ai" className="mb-2">
                <Sparkles className="h-3 w-3" />
                Quick start
              </Badge>
              <h2 className="text-lg font-semibold tracking-tight text-copy-primary">
                Start from a template
              </h2>
              <p className="text-sm text-copy-muted">
                Import a pre-built architecture into a fresh project.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                title: "Microservices",
                body: "API gateway, services, shared DB.",
                shape: "<API> · <Svc> · <DB>",
                accent: "from-brand/30 to-ai/20",
              },
              {
                title: "CI/CD Pipeline",
                body: "Code → build → test → prod.",
                shape: "<Push> → <Deploy>",
                accent: "from-green/20 to-brand/20",
              },
              {
                title: "Event-Driven",
                body: "Producer → bus → subscribers.",
                shape: "<Pub> · <Bus>",
                accent: "from-ai/30 to-brand/15",
              },
            ].map((t) => (
              <div
                key={t.title}
                className="group relative overflow-hidden rounded-2xl border border-border-default bg-elevated/40 p-5 inset-stroke transition-all duration-300 hover:-translate-y-0.5 hover:border-border-subtle hover:bg-elevated"
              >
                <div
                  className={cn(
                    "pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-br opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
                    t.accent
                  )}
                />
                <div className="relative">
                  <div className="mb-4 flex h-24 items-center justify-center rounded-xl bg-canvas ring-1 ring-border-default/60">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-tight text-copy-muted">
                      <Network className="h-4 w-4 text-brand" />
                      <span className="rounded-md bg-subtle px-2 py-1">
                        {t.shape}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight text-copy-primary">
                    {t.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-copy-muted">
                    {t.body}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-copy-faint">
                      6 nodes · 5 edges
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={openCreate}
                      className="h-7 gap-1 px-2 text-brand hover:text-brand"
                    >
                      Use
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="my-2 h-px w-full bg-border-default/40" />
        <p className="text-center text-xs text-copy-faint">
          Tip: press{" "}
          <kbd className="rounded border border-border-default bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-copy-secondary">
            /
          </kbd>{" "}
          for keyboard shortcuts inside a canvas.
        </p>
      </div>
    </div>
  );
}

// ── Project card ───────────────────────────────────────────────────────────

interface ProjectCardProps {
  title: string;
  href: string;
  updatedAt: Date | string;
  isOwner: boolean;
  isShared: boolean;
  /** When true, the relative-date label has been hydrated on the client. */
  hasNow: boolean;
}

function ProjectCard({
  title,
  href,
  updatedAt,
  isOwner,
  isShared,
  hasNow,
}: ProjectCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border-default bg-elevated/40 p-5 inset-stroke transition-all duration-300 hover:-translate-y-0.5 hover:border-border-subtle hover:bg-elevated hover:shadow-xl hover:shadow-brand/5"
    >
      <div className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-brand/0 blur-2xl transition-all duration-500 group-hover:bg-brand/15" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold tracking-tight text-copy-primary">
            {title}
          </h3>
          <p className="mt-1 text-xs text-copy-muted">
            {isShared ? "Shared with you" : "Owner"}
          </p>
        </div>
        {isShared ? (
          <Badge variant="secondary" size="sm">
            <Share2 className="h-2.5 w-2.5" />
            Shared
          </Badge>
        ) : (
          <Badge variant="default" size="sm">
            Owner
          </Badge>
        )}
      </div>

      <div className="bg-grid relative mt-4 h-28 overflow-hidden rounded-lg border border-border-default/60 bg-canvas">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-wrap items-center justify-center gap-2 p-2 text-[10px] text-copy-faint">
            <span className="rounded bg-subtle/80 px-1.5 py-1 font-mono">
              ⟨node⟩
            </span>
            <span>→</span>
            <span className="rounded bg-subtle/80 px-1.5 py-1 font-mono">
              ⟨svc⟩
            </span>
            <span>→</span>
            <span className="rounded bg-subtle/80 px-1.5 py-1 font-mono">
              ⟨db⟩
            </span>
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-copy-muted">
          <Clock className="h-3 w-3" />
          {hasNow ? formatRelativeDate(updatedAt) : "—"}
        </span>
        <span className="text-copy-faint">
          {isOwner
            ? hasNow
              ? formatExactDate(updatedAt)
              : "Editable"
            : "View only"}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-brand/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </Link>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="surface-elevated relative overflow-hidden rounded-3xl border border-border-subtle p-10 text-center inset-stroke">
      <div className="bg-spotlight pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[420px] -translate-x-1/2 rounded-full bg-brand/30 blur-3xl" />
      <div className="relative mx-auto max-w-md">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/30 to-ai/30 ring-1 ring-white/10 shadow-lg shadow-brand/20">
          <Sparkles className="h-6 w-6 text-brand" />
        </div>
        <h2 className="text-balance text-xl font-semibold tracking-tight text-copy-primary sm:text-2xl">
          Design your first system
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-copy-secondary">
          Create a new project to spin up a collaborative canvas. Invite your
          team, prompt the AI, and export a spec — all in one place.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button
            onClick={onCreate}
            size="lg"
            className="gap-2 shadow-lg shadow-brand/25 ring-1 ring-white/10"
          >
            <Plus className="h-4 w-4" />
            Create your first project
          </Button>
        </div>
      </div>
    </section>
  );
}

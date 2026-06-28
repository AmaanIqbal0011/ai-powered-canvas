"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectDialog } from "@/context/project-dialog-context";
import type { ProjectListItem } from "@/lib/project-data";
import { cn, formatRelativeDate } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
  currentUserId: string;
  /** When viewing a workspace, highlight the matching sidebar entry. */
  activeRoomId?: string;
}

/** Returns the current time after the client has mounted, avoiding SSR/CSR text drift. */
function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

function ProjectItem({
  project,
  isOwned,
  isActive,
  onRename,
  onDelete,
  hydrated,
}: {
  project: ProjectListItem;
  isOwned: boolean;
  isActive: boolean;
  onRename?: (project: ProjectListItem) => void;
  onDelete?: (project: ProjectListItem) => void;
  hydrated?: boolean;
}) {
  return (
    <Link
      href={`/editor/${project.id}`}
      className={cn(
        "group/item relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
        isActive
          ? "border border-brand/30 bg-brand-dim/60 text-brand shadow-sm shadow-brand/5"
          : "border border-transparent text-copy-primary hover:-translate-y-0.5 hover:border-border-default hover:bg-elevated"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand" />
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-medium",
          isActive ? "text-brand" : "text-copy-primary"
        )}
      >
        {project.name}
      </span>

      <span className="flex shrink-0 items-center gap-1 text-[10px] uppercase tracking-wider text-copy-faint opacity-0 transition-opacity group-hover/item:opacity-100">
        {hydrated ? formatRelativeDate(project.updatedAt) : "—"}
      </span>

      {isOwned && (
        <div
          className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/item:opacity-100"
          onClick={(e) => e.preventDefault()}
        >
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onRename?.(project);
            }}
            aria-label={`Rename ${project.name}`}
            className="text-copy-muted hover:text-copy-primary"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete?.(project);
            }}
            aria-label={`Delete ${project.name}`}
            className="text-copy-muted hover:text-error"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </Link>
  );
}

/**
 * Floating project sidebar that slides in from the left.
 *
 * - Floats above the editor canvas (does not push content)
 * - Fixed positioning with z-50
 * - Header with brand summary, "Projects" title and close button
 * - Search field + shadcn Tabs ("My Projects" / "Shared")
 * - Project list with rename/delete actions for owned projects
 * - Full-width "New Project" CTA at the bottom
 * - Active project highlighted when `activeRoomId` is provided
 */
export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  currentUserId,
  activeRoomId,
}: ProjectSidebarProps) {
  const { openCreate, openRename, openDelete } = useProjectDialog();
  const [search, setSearch] = useState("");
  const hydrated = useHydrated();

  const filteredOwned = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ownedProjects;
    return ownedProjects.filter(p => p.name.toLowerCase().includes(q));
  }, [ownedProjects, search]);

  const filteredShared = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sharedProjects;
    return sharedProjects.filter(p => p.name.toLowerCase().includes(q));
  }, [sharedProjects, search]);

  return (
    <>
      {/* Semi-transparent backdrop — also handles mobile tap-outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-80 flex-col border-r border-border-default bg-elevated/95 shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default/60 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand/30 to-ai/30 ring-1 ring-white/5">
              <Users className="h-3.5 w-3.5 text-brand" />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-copy-primary">
                Projects
              </h2>
              <p className="text-[10px] uppercase tracking-wider text-copy-faint">
                {ownedProjects.length + sharedProjects.length} workspace
                {ownedProjects.length + sharedProjects.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close projects sidebar"
            className="text-copy-muted hover:text-copy-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-copy-faint" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="h-9 pl-9 text-sm"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="my-projects" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="mx-3 mt-3 grid grid-cols-2">
            <TabsTrigger value="my-projects" className="flex-1">
              <span className="flex items-center gap-1.5">
                Mine
                <Badge variant="ghost" size="sm" className="text-[9px]">
                  {ownedProjects.length}
                </Badge>
              </span>
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              <span className="flex items-center gap-1.5">
                Shared
                <Badge variant="ghost" size="sm" className="text-[9px]">
                  {sharedProjects.length}
                </Badge>
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="my-projects" className="mt-0 h-full">
              {filteredOwned.length === 0 ? (
                <EmptyHint
                  hasQuery={search.length > 0}
                  message={search ? "No matches." : "Create your first project to get started."}
                />
              ) : (
                <ScrollArea className="h-full">
                  <div className="flex flex-col gap-1 px-2 py-3">
                    {filteredOwned.map((project) => (
                      <ProjectItem
                        key={project.id}
                        project={project}
                        isOwned={true}
                        isActive={activeRoomId === project.id}
                        onRename={openRename}
                        onDelete={openDelete}
                        hydrated={hydrated}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="shared" className="mt-0 h-full">
              {filteredShared.length === 0 ? (
                <EmptyHint
                  hasQuery={search.length > 0}
                  message={
                    search
                      ? "No matches."
                      : "Projects your team shares with you will appear here."
                  }
                />
              ) : (
                <ScrollArea className="h-full">
                  <div className="flex flex-col gap-1 px-2 py-3">
                    {filteredShared.map((project) => (
                      <ProjectItem
                        key={project.id}
                        project={project}
                        isOwned={false}
                        isActive={activeRoomId === project.id}
                        hydrated={hydrated}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* New Project CTA */}
        <div className="border-t border-border-default/60 p-3">
          <Button
            className="group w-full gap-2 shadow-md shadow-brand/15"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            New project
            <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
          </Button>
        </div>
      </aside>
    </>
  );
}

// ── Empty hint ─────────────────────────────────────────────────────────────

function EmptyHint({ message, hasQuery }: { message: string; hasQuery: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-subtle/60">
        <Search className="h-4 w-4 text-copy-faint" />
      </div>
      <p className="text-sm text-copy-muted">{message}</p>
      {hasQuery && (
        <p className="text-[11px] text-copy-faint">
          Try a different keyword.
        </p>
      )}
    </div>
  );
}

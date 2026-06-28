"use client";

import Link from "next/link";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectDialog } from "@/context/project-dialog-context";
import type { ProjectListItem } from "@/lib/project-data";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
  currentUserId: string;
  /** When viewing a workspace, highlight the matching sidebar entry. */
  activeRoomId?: string;
}

function ProjectItem({
  project,
  isOwned,
  isActive,
  onRename,
  onDelete,
}: {
  project: ProjectListItem;
  isOwned: boolean;
  isActive: boolean;
  onRename?: (project: ProjectListItem) => void;
  onDelete?: (project: ProjectListItem) => void;
}) {
  return (
    <Link
      href={`/editor/${project.id}`}
      className={cn(
        "group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-subtle",
        isActive ? "bg-brand-dim text-brand" : "cursor-pointer"
      )}
    >
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          isActive ? "text-brand" : "text-copy-primary"
        )}
      >
        {project.name}
      </span>

      {isOwned && (
        <div
          className="flex shrink-0 items-center gap-0.5"
          onClick={(e) => e.preventDefault()}
        >
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onRename?.(project);
            }}
            aria-label={`Rename ${project.name}`}
            className="opacity-0 group-hover:opacity-100"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(project);
            }}
            aria-label={`Delete ${project.name}`}
            className="opacity-0 group-hover:opacity-100 text-copy-muted hover:text-error"
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
 * - Header with "Projects" title and close button
 * - shadcn Tabs: "My Projects" and "Shared"
 * - Project list with rename/delete actions for owned projects
 * - Full-width "New Project" button at the bottom
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

  return (
    <>
      {/* Semi-transparent backdrop — also handles mobile tap-outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-80 flex-col border-r border-border-default bg-elevated shadow-lg transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <h2 className="text-sm font-semibold text-copy-primary">Projects</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close projects sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="my-projects" className="flex flex-1 flex-col">
          <TabsList className="mx-3 mt-3">
            <TabsTrigger value="my-projects" className="flex-1">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              Shared
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="my-projects" className="h-full">
              {ownedProjects.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <p className="text-sm text-copy-muted">
                    No projects yet. Create your first project to get started.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="flex flex-col gap-0.5 px-2 py-3">
                    {ownedProjects.map((project) => (
                      <ProjectItem
                        key={project.id}
                        project={project}
                        isOwned={true}
                        isActive={activeRoomId === project.id}
                        onRename={openRename}
                        onDelete={openDelete}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="shared" className="h-full">
              {sharedProjects.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <p className="text-sm text-copy-muted">
                    No shared projects. Projects shared with you will appear
                    here.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="flex flex-col gap-0.5 px-2 py-3">
                    {sharedProjects.map((project) => (
                      <ProjectItem
                        key={project.id}
                        project={project}
                        isOwned={false}
                        isActive={activeRoomId === project.id}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* New Project button */}
        <div className="border-t border-border-default p-3">
          <Button className="w-full" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}

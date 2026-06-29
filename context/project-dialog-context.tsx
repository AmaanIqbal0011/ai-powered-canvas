"use client";

import { createContext, useContext, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { ProjectListItem } from "@/lib/project-data";

interface ProjectDialogContextValue {
  openCreate: () => void;
  openRename: (project: ProjectListItem) => void;
  openDelete: (project: ProjectListItem) => void;
}

const ProjectDialogContext = createContext<ProjectDialogContextValue | null>(
  null
);

export function useProjectDialog(): ProjectDialogContextValue {
  const ctx = useContext(ProjectDialogContext);
  if (!ctx) {
    throw new Error(
      "useProjectDialog must be used within ProjectDialogProvider"
    );
  }
  return ctx;
}

export function ProjectDialogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    dialogType,
    selectedProject,
    projectName,
    setProjectName,
    roomId,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    close,
    handleSubmit,
  } = useProjectActions();

  return (
    <ProjectDialogContext.Provider
      value={{ openCreate, openRename, openDelete }}
    >
      {children}

      {/* ── Create Project Dialog ── */}
      <Dialog
        open={dialogType === "create"}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Enter a name for your new architecture workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="project-name"
                className="text-sm font-medium text-copy-primary"
              >
                Project Name
              </label>
              <Input
                className="text-white"
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Microservice Architecture"
                autoFocus
              />
            </div>

            {roomId && (
              <div className="space-y-1">
                <p className="text-xs text-copy-muted">Room ID preview</p>
                <p className="font-mono text-sm text-copy-secondary">
                  {roomId}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!roomId || isLoading}
            >
              {isLoading ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rename Project Dialog ── */}
      <Dialog
        open={dialogType === "rename"}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Rename{" "}
              <span className="font-medium text-copy-primary">
                {selectedProject?.name}
              </span>{" "}
              to something new.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && projectName.trim()) {
                handleSubmit();
              }
            }}
          />

          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!projectName.trim() || isLoading}
            >
              {isLoading ? "Renaming…" : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Project Dialog ── */}
      <Dialog
        open={dialogType === "delete"}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-copy-primary">
                {selectedProject?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProjectDialogContext.Provider>
  );
}

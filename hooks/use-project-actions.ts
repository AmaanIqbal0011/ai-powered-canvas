"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { ProjectListItem } from "@/lib/project-data";
import { slugify, shortId } from "@/lib/utils";

type DialogType = "create" | "rename" | "delete" | null;

export function useProjectActions() {
  const router = useRouter();

  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [selectedProject, setSelectedProject] =
    useState<ProjectListItem | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Random suffix generated once when the create dialog opens.
   * Using a ref avoids regenerating the suffix on every keystroke.
   */
  const createSuffixRef = useRef<string | null>(null);

  /** The room ID shown in the create-dialog preview: slug + 6-char suffix. */
  const roomId = useMemo(() => {
    if (dialogType !== "create") return "";
    const suffix = createSuffixRef.current;
    if (!suffix) return "";
    const slug = slugify(projectName);
    if (!slug) {
      // Fallback: use "project" as the base when the name has no slug chars
      return `project-${suffix}`;
    }
    return `${slug}-${suffix}`;
  }, [projectName, dialogType]);

  // ── Openers ──────────────────────────────────────────────

  const openCreate = useCallback(() => {
    createSuffixRef.current = shortId();
    setDialogType("create");
    setSelectedProject(null);
    setProjectName("");
  }, []);

  const openRename = useCallback((project: ProjectListItem) => {
    setDialogType("rename");
    setSelectedProject(project);
    setProjectName(project.name);
  }, []);

  const openDelete = useCallback((project: ProjectListItem) => {
    setDialogType("delete");
    setSelectedProject(project);
    setProjectName("");
  }, []);

  const close = useCallback(() => {
    setDialogType(null);
    setSelectedProject(null);
    setProjectName("");
    setIsLoading(false);
  }, []);

  // ── Mutations ────────────────────────────────────────────

  const handleCreate = useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim(), id: roomId }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create project (${res.status})`);
      }

      const { data } = await res.json();
      close();
      router.push(`/editor/${data.id}`);
    } catch (err) {
      console.error("Create project error:", err);
      setIsLoading(false);
    }
  }, [roomId, projectName, close, router]);

  const handleRename = useCallback(async () => {
    if (!selectedProject || !projectName.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Failed to rename project (${res.status})`);
      }

      close();
      router.refresh();
    } catch (err) {
      console.error("Rename project error:", err);
      setIsLoading(false);
    }
  }, [selectedProject, projectName, close, router]);

  const handleDelete = useCallback(async () => {
    if (!selectedProject) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Failed to delete project (${res.status})`);
      }

      close();

      // If deleting the currently open workspace, redirect to editor home
      const currentPath = window.location.pathname;
      if (
        currentPath === `/editor/${selectedProject.id}` ||
        currentPath.startsWith(`/editor/${selectedProject.id}/`)
      ) {
        router.push("/editor");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Delete project error:", err);
      setIsLoading(false);
    }
  }, [selectedProject, close, router]);

  // ── Dispatcher ───────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    switch (dialogType) {
      case "create":
        return handleCreate();
      case "rename":
        return handleRename();
      case "delete":
        return handleDelete();
      default:
        break;
    }
  }, [dialogType, handleCreate, handleRename, handleDelete]);

  return {
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
  };
}

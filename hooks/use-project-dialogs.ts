"use client";

import { useCallback, useMemo, useState } from "react";

import { slugify } from "@/lib/utils";
import type { MockProject } from "@/lib/mock-data";

type DialogType = "create" | "rename" | "delete" | null;

export function useProjectDialogs() {
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [selectedProject, setSelectedProject] = useState<MockProject | null>(
    null
  );
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slug = useMemo(() => slugify(projectName), [projectName]);

  const openCreate = useCallback(() => {
    setDialogType("create");
    setSelectedProject(null);
    setProjectName("");
  }, []);

  const openRename = useCallback((project: MockProject) => {
    setDialogType("rename");
    setSelectedProject(project);
    setProjectName(project.name);
  }, []);

  const openDelete = useCallback((project: MockProject) => {
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

  const handleSubmit = useCallback(() => {
    setIsLoading(true);
    // Mock async operation — no API calls yet
    setTimeout(() => {
      setIsLoading(false);
      close();
    }, 500);
  }, [close]);

  return {
    dialogType,
    selectedProject,
    projectName,
    setProjectName,
    slug,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    close,
    handleSubmit,
  };
}

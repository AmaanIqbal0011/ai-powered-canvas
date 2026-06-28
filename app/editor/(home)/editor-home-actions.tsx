"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProjectDialog } from "@/context/project-dialog-context";

/**
 * Client component that renders the New Project button on the editor home page.
 * Must be a client component because it calls useProjectDialog().
 */
export function EditorHomeActions() {
  const { openCreate } = useProjectDialog();

  return (
    <Button className="mt-2" onClick={openCreate}>
      <Plus className="h-4 w-4" />
      New Project
    </Button>
  );
}

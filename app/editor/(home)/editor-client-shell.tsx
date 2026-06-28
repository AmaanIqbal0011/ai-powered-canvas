"use client";

import { useState, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogProvider } from "@/context/project-dialog-context";
import type { ProjectListItem } from "@/lib/project-data";

interface EditorClientShellProps {
  children: ReactNode;
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
  currentUserId: string;
}

export function EditorClientShell({
  children,
  ownedProjects,
  sharedProjects,
  currentUserId,
}: EditorClientShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <ProjectDialogProvider>
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          currentUserId={currentUserId}
        />
        <EditorNavbar
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="relative flex flex-1 overflow-hidden bg-base">
          {children}
        </main>
      </ProjectDialogProvider>
    </>
  );
}

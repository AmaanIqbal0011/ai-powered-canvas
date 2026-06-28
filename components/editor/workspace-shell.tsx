"use client";

import { useState, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ShareDialog } from "@/components/editor/share-dialog";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { ProjectDialogProvider } from "@/context/project-dialog-context";
import { TemplateImportProvider } from "@/context/template-import-context";
import { SaveStatusProvider, useSaveStatus } from "@/context/save-status-context";
import {
  AiSidebarStateProvider,
  useAiSidebarState,
} from "@/context/ai-sidebar-state-context";
import type { ProjectListItem } from "@/lib/project-data";

interface WorkspaceShellProps {
  children: ReactNode;
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
  currentUserId: string;
  roomId: string;
}

/**
 * Inner content of the workspace shell — reads the save status context
 * so it can pass the status to the navbar.
 */
function WorkspaceShellContent({
  children,
  ownedProjects,
  sharedProjects,
  currentUserId,
  roomId,
}: WorkspaceShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const { status: saveStatus, triggerSave } = useSaveStatus();
  const { isOpen: aiSidebarOpen, toggle: toggleAiSidebar, close: closeAiSidebar } =
    useAiSidebarState();

  const project =
    ownedProjects.find((p) => p.id === roomId) ??
    sharedProjects.find((p) => p.id === roomId);

  const isOwner = project?.ownerId === currentUserId;

  return (
    <div className="flex h-screen flex-col">
      <ProjectDialogProvider>
        <TemplateImportProvider>
          {/* ── Overlaying sidebars (outside main flex flow) ── */}
          <ProjectSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            ownedProjects={ownedProjects}
            sharedProjects={sharedProjects}
            currentUserId={currentUserId}
            activeRoomId={roomId}
          />

          {/* AI sidebar backdrop */}
          {aiSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/20"
              onClick={closeAiSidebar}
              aria-hidden="true"
            />
          )}

          <EditorNavbar
            sidebarOpen={sidebarOpen}
            onSidebarToggle={() => setSidebarOpen((prev) => !prev)}
            projectName={project?.name}
            onShare={() => setShareOpen(true)}
            aiSidebarOpen={aiSidebarOpen}
            onAiToggle={toggleAiSidebar}
            onOpenTemplates={() => setTemplatesOpen(true)}
            saveStatus={saveStatus}
            onSave={triggerSave}
          />

          <main className="relative flex flex-1 overflow-hidden bg-base">
            {children}
          </main>

          {/* Share dialog */}
          <ShareDialog
            projectId={roomId}
            isOwner={isOwner}
            open={shareOpen}
            onClose={() => setShareOpen(false)}
          />

          {/* Starter templates modal */}
          <StarterTemplatesModal
            open={templatesOpen}
            onClose={() => setTemplatesOpen(false)}
          />
        </TemplateImportProvider>
      </ProjectDialogProvider>
    </div>
  );
}

/**
 * Client shell for the workspace route group.
 *
 * Manages the left sidebar and right AI sidebar open/close state,
 * wires the project-aware navbar and sidebar, and provides the
 * project dialog context for rename/delete actions.
 * Also manages the share dialog and canvas save status.
 */
export function WorkspaceShell({
  children,
  ownedProjects,
  sharedProjects,
  currentUserId,
  roomId,
}: WorkspaceShellProps) {
  return (
    <SaveStatusProvider>
      <AiSidebarStateProvider>
        <WorkspaceShellContent
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          currentUserId={currentUserId}
          roomId={roomId}
        >
          {children}
        </WorkspaceShellContent>
      </AiSidebarStateProvider>
    </SaveStatusProvider>
  );
}

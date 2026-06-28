"use client";

import { useState, useRef, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Bot,
  BotOff,
  LayoutTemplate,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorNavbarProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;

  /** Project name shown in the center of the navbar (workspace view only). */
  projectName?: string;

  /** Share callback (workspace view only). */
  onShare?: () => void;

  /** AI sidebar state and toggle (workspace view only). */
  aiSidebarOpen?: boolean;
  onAiToggle?: () => void;

  /** Starter templates modal trigger. */
  onOpenTemplates?: () => void;

  /** Canvas save status for the autosave indicator. */
  saveStatus?: SaveStatus;

  /** Manual save callback (workspace view only). */
  onSave?: () => void;
}

/**
 * Fixed-height top navbar for the editor workspace.
 *
 * In **home** mode (no projectName) it shows the sidebar toggle and UserButton.
 * In **workspace** mode (projectName provided) it also shows the project name
 * in the center, a share button, and an AI sidebar toggle.
 */
export function EditorNavbar({
  sidebarOpen,
  onSidebarToggle,
  projectName,
  onShare,
  aiSidebarOpen,
  onAiToggle,
  onOpenTemplates,
  saveStatus,
  onSave,
}: EditorNavbarProps) {
  // Local display state for the Save button with auto-return timeout
  const [buttonStatus, setButtonStatus] = useState<SaveStatus>("idle");
  const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setButtonStatus(saveStatus ?? "idle");

    // Auto-return from "saved" or "error" back to "idle" after 2 seconds
    if (saveStatus === "saved" || saveStatus === "error") {
      if (returnTimerRef.current) {
        clearTimeout(returnTimerRef.current);
      }
      returnTimerRef.current = setTimeout(() => {
        setButtonStatus("idle");
      }, 2000);
    }

    return () => {
      if (returnTimerRef.current) {
        clearTimeout(returnTimerRef.current);
      }
    };
  }, [saveStatus]);

  const handleSaveClick = () => {
    if (returnTimerRef.current) {
      clearTimeout(returnTimerRef.current);
    }
    onSave?.();
  };

  const saveButtonLabel = (() => {
    switch (buttonStatus) {
      case "saving":
        return "Saving...";
      case "saved":
        return "Saved";
      case "error":
        return "Error";
      default:
        return "Save";
    }
  })();
  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center border-b border-border-default bg-surface px-4"
      )}
    >
      {/* Left section — sidebar toggle + optional project name */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onSidebarToggle}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>

        {projectName && (
          <span className="text-sm font-medium text-copy-primary">
            {projectName}
          </span>
        )}
      </div>

      {/* Center section — flex spacer */}
      <div className="flex-1" />

      {/* Right section — templates, share, AI toggle, user menu */}
      <div className="flex items-center gap-1">
        {projectName && onOpenTemplates && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenTemplates}
            aria-label="Open starter templates"
          >
            <LayoutTemplate className="h-4 w-4" />
          </Button>
        )}

        {projectName && onShare && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onShare}
            aria-label="Share project"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        )}

        {projectName && onAiToggle && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onAiToggle}
            aria-label={
              aiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"
            }
          >
            {aiSidebarOpen ? (
              <BotOff className="h-4 w-4 text-ai" />
            ) : (
              <Bot className="h-4 w-4 text-ai" />
            )}
          </Button>
        )}

        {/* Save button — workspace mode only */}
        {projectName && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveClick}
            disabled={buttonStatus === "saving"}
            className={cn(
              "h-7 text-xs",
              buttonStatus === "saved" &&
                "border-green-600 text-green-500",
              buttonStatus === "error" && "border-error text-error",
            )}
          >
            {saveButtonLabel}
          </Button>
        )}

        {!projectName && <UserButton />}
      </div>
    </header>
  );
}

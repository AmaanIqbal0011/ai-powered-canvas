"use client";

import { useState, useRef, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import {
  Cloud,
  CloudOff,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Bot,
  BotOff,
  LayoutTemplate,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteLogo } from "@/components/site/site-logo";
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
 * Sticky top navbar for the editor workspace.
 *
 * In **home** mode (no projectName) it shows the sidebar toggle,
 * the brand mark and the Clerk UserButton.
 * In **workspace** mode (projectName provided) it also shows the
 * project name in the center, a share button, AI sidebar toggle,
 * template picker, save indicator and manual save action.
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

  const isWorkspace = !!projectName;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-border-default/60 bg-surface/70 backdrop-blur-xl"
      )}
    >
      {/* ── Left section: sidebar toggle + brand/project name ── */}
      <div className="flex items-center gap-3 px-4">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onSidebarToggle}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="text-copy-secondary hover:text-copy-primary"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>

        {isWorkspace ? (
          <div className="flex items-center gap-2">
            <SiteLogo size="sm" withGlow={false} href="/editor" />
            <span className="text-copy-faint">/</span>
            <span className="max-w-[28ch] truncate text-sm font-semibold tracking-tight text-copy-primary">
              {projectName}
            </span>
          </div>
        ) : (
          <SiteLogo size="sm" withGlow={false} />
        )}
      </div>

      {/* ── Center section ── */}
      <div className="flex-1" />

      {/* ── Right section ── */}
      <div className="flex items-center gap-1.5 px-4">
        {isWorkspace && onOpenTemplates && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenTemplates}
            className="hidden text-copy-secondary hover:text-copy-primary sm:inline-flex"
            aria-label="Open starter templates"
          >
            <LayoutTemplate className="h-4 w-4" />
            <span className="ml-1.5 hidden lg:inline">Templates</span>
          </Button>
        )}

        {isWorkspace && onShare && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="hidden text-copy-secondary hover:text-copy-primary sm:inline-flex"
            aria-label="Share project"
          >
            <Share2 className="h-4 w-4" />
            <span className="ml-1.5 hidden lg:inline">Share</span>
          </Button>
        )}

        {isWorkspace && onAiToggle && (
          <Button
            variant={aiSidebarOpen ? "secondary" : "ghost"}
            size="sm"
            onClick={onAiToggle}
            aria-label={
              aiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"
            }
            className={cn(
              "gap-1.5",
              aiSidebarOpen
                ? "bg-ai-dim text-ai-text hover:bg-ai/20"
                : "text-copy-secondary hover:text-copy-primary"
            )}
          >
            {aiSidebarOpen ? (
              <BotOff className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            <span className="hidden lg:inline">AI</span>
          </Button>
        )}

        {/* Save indicator + button — workspace mode only */}
        {isWorkspace && (
          <div className="flex items-center gap-2">
            <SaveIndicator status={buttonStatus} />
            <Button
              variant={buttonStatus === "saved" ? "secondary" : "outline"}
              size="sm"
              onClick={handleSaveClick}
              disabled={buttonStatus === "saving"}
              className={cn(
                "h-8 gap-1.5 px-2.5 text-xs transition-all",
                buttonStatus === "saved" &&
                  "border-green/30 bg-green-dim text-green",
                buttonStatus === "error" &&
                  "border-error/30 bg-error-dim text-error"
              )}
            >
              {buttonStatus === "saving" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="hidden sm:inline">Saving…</span>
                </>
              ) : buttonStatus === "saved" ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Saved</span>
                </>
              ) : buttonStatus === "error" ? (
                <>
                  <CloudOff className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Error</span>
                </>
              ) : (
                <>
                  <Cloud className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </>
              )}
            </Button>
          </div>
        )}

        {!isWorkspace && (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 ring-1 ring-border-subtle",
              },
            }}
          />
        )}
      </div>
    </header>
  );
}

// ── Save indicator chip ───────────────────────────────────────────────────

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") {
    return (
      <Badge variant="ghost" size="sm" className="hidden sm:inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-copy-faint" />
        Auto
      </Badge>
    );
  }
  if (status === "saving") {
    return (
      <Badge variant="ai" size="sm" className="hidden animate-pulse sm:inline-flex">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving
      </Badge>
    );
  }
  if (status === "saved") {
    return (
      <Badge variant="success" size="sm" className="hidden sm:inline-flex">
        <Check className="h-3 w-3" />
        Synced
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" size="sm" className="hidden sm:inline-flex">
      <CloudOff className="h-3 w-3" />
      Error
    </Badge>
  );
}

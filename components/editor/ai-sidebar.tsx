"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  X,
  Bot,
  Send,
  Sparkles,
  FileText,
  Download,
  Loader2,
  Eraser,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useChatFeed } from "@/context/chat-feed-context";
import { SpecPreviewModal } from "@/components/editor/spec-preview-modal";

interface ProjectSpec {
  id: string;
  filePath: string;
  createdAt: string;
}

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  projectId: string;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Subscribes to a Trigger.dev run via useRealtimeRun.
 * Only renders when a valid accessToken is provided.
 * Reports status changes back to the parent via callbacks.
 */
function RunStatusTracker({
  runId,
  accessToken,
  onCompleted,
  onFailed,
  onCancelled,
  onError,
}: {
  runId: string;
  accessToken: string;
  onCompleted: () => void;
  onFailed: () => void;
  onCancelled: () => void;
  onError: (err: Error) => void;
}) {
  const { run, error: runError } = useRealtimeRun(runId, {
    accessToken,
  });

  useEffect(() => {
    if (runError) {
      onError(runError);
    }
  }, [runError, onError]);

  useEffect(() => {
    if (!run?.status) return;
    if (run.status === "COMPLETED") onCompleted();
    else if (run.status === "FAILED") onFailed();
    else if (run.status === "CANCELED") onCancelled();
  }, [run?.status, onCompleted, onFailed, onCancelled]);

  return null;
}

/**
 * Floating AI sidebar with AI Architect (chat) and Specs tabs.
 *
 * Slides in from the right side. The open/close state is controlled
 * by the parent via `isOpen` / `onClose`. Sends prompts to the AI
 * design agent API and subscribes to the shared AI status feed.
 */
export function AiSidebar({ isOpen, onClose, roomId, projectId }: AiSidebarProps) {
  const [inputValue, setInputValue] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specs, setSpecs] = useState<ProjectSpec[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [previewSpecId, setPreviewSpecId] = useState<string | null>(null);
  const [specRunId, setSpecRunId] = useState<string | null>(null);
  const [specPublicToken, setSpecPublicToken] = useState<string | null>(null);
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);
  const { user } = useUser();
  const { feedMessage, chatMessages, sendChatMessage, sendAssistantMessage, clearChatMessages, chatLoading } = useChatFeed();
  const scrollRef = useRef<HTMLDivElement>(null);

  const isGenerating = isSubmitting || (runId !== null && publicToken !== null);
  const isBusy = isGenerating || chatLoading;

  // Fetch specs for the current project
  const fetchSpecs = useCallback(async () => {
    setSpecsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/specs`);
      if (res.ok) {
        const { data } = await res.json();
        setSpecs(data);
      }
    } catch {
      // Silent fail — specs list is non-critical
    } finally {
      setSpecsLoading(false);
    }
  }, [projectId]);

  // Fetch specs when the sidebar opens
  useEffect(() => {
    if (isOpen) {
      fetchSpecs();
    }
  }, [isOpen, fetchSpecs]);

  const handleDownloadSpec = useCallback(
    (specId: string) => {
      const url = `/api/projects/${projectId}/specs/${specId}/download`;
      const a = document.createElement("a");
      a.href = url;
      a.download = `spec-${specId}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    [projectId]
  );

  const formatSpecDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleGenerateSpec = useCallback(async () => {
    if (isGeneratingSpec) return;

    setIsGeneratingSpec(true);
    setSendError(null);

    try {
      const specRes = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });

      if (!specRes.ok) {
        const err = await specRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start spec generation");
      }

      const { data: { runId: newRunId } } = await specRes.json();

      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: newRunId }),
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to get access token");
      }

      const { data: { token } } = await tokenRes.json();

      setSpecRunId(newRunId);
      setSpecPublicToken(token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setSendError(msg);
      setIsGeneratingSpec(false);
    }
  }, [roomId, isGeneratingSpec]);

  const handleSpecRunCompleted = useCallback(() => {
    setTimeout(() => {
      setSpecRunId(null);
      setSpecPublicToken(null);
      setIsGeneratingSpec(false);
      fetchSpecs();
    }, 1500);
  }, [fetchSpecs]);

  const handleSpecRunFailed = useCallback(() => {
    setSendError("Spec generation failed. Please try again.");
    setTimeout(() => {
      setSpecRunId(null);
      setSpecPublicToken(null);
      setIsGeneratingSpec(false);
    }, 1500);
  }, []);

  const handleSpecRunCancelled = useCallback(() => {
    setSendError("Spec generation was cancelled.");
    setTimeout(() => {
      setSpecRunId(null);
      setSpecPublicToken(null);
      setIsGeneratingSpec(false);
    }, 1500);
  }, []);

  const handleSpecRunError = useCallback(() => {
    setSendError("Connection lost. Please try again.");
    setSpecRunId(null);
    setSpecPublicToken(null);
    setIsGeneratingSpec(false);
  }, []);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Callbacks for RunStatusTracker
  const handleRunCompleted = useCallback(() => {
    sendAssistantMessage("Design generated successfully. Check the canvas for updates.");
    setTimeout(() => {
      setRunId(null);
      setPublicToken(null);
    }, 1500);
  }, [sendAssistantMessage]);

  const handleRunFailed = useCallback(() => {
    sendAssistantMessage("Design generation failed. Please try again.");
    setTimeout(() => {
      setRunId(null);
      setPublicToken(null);
    }, 1500);
  }, [sendAssistantMessage]);

  const handleRunCancelled = useCallback(() => {
    sendAssistantMessage("Design generation was cancelled.");
    setTimeout(() => {
      setRunId(null);
      setPublicToken(null);
    }, 1500);
  }, [sendAssistantMessage]);

  const handleRunError = useCallback((err: Error) => {
    setSendError("Connection lost. Please try again.");
    setRunId(null);
    setPublicToken(null);
  }, []);

  const handleSendChat = useCallback(
    async (content: string) => {
      if (!content.trim() || isBusy) return;

      const senderName = user?.fullName ?? user?.username ?? "Anonymous";
      setInputValue("");
      setSendError(null);

      const ok = await sendChatMessage(content.trim(), senderName);
      if (!ok) {
        setSendError("Failed to send message. Try again.");
      }
    },
    [user, sendChatMessage, isBusy]
  );

  const handleDesignSubmit = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || isBusy) return;

      const senderName = user?.fullName ?? user?.username ?? "Anonymous";
      setInputValue("");
      setSendError(null);
      setIsSubmitting(true);

      try {
        // Send user message to chat
        await sendChatMessage(prompt, senderName);

        // Call design API
        const designRes = await fetch("/api/ai/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, roomId, projectId }),
        });

        if (!designRes.ok) {
          const err = await designRes.json().catch(() => ({}));
          throw new Error(err.error || "Failed to start design generation");
        }

        const { data: { runId: newRunId } } = await designRes.json();

        // Get public token for realtime tracking
        const tokenRes = await fetch("/api/ai/design/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: newRunId }),
        });

        if (!tokenRes.ok) {
          throw new Error("Failed to get access token");
        }

        const { data: { token } } = await tokenRes.json();

        setRunId(newRunId);
        setPublicToken(token);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setSendError(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, sendChatMessage, roomId, projectId, isBusy]
  );

  const handleSubmit = () => {
    if (!inputValue.trim() || isBusy) return;
    handleDesignSubmit(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-50 flex h-full w-72 flex-col",
        "border-l border-border-default bg-base/95 shadow-lg backdrop-blur-sm",
        "transition-transform duration-200 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
      aria-hidden={!isOpen}
    >
      {/* Run status tracker — only mounts when a run is active */}
      {runId && publicToken && (
        <RunStatusTracker
          runId={runId}
          accessToken={publicToken}
          onCompleted={handleRunCompleted}
          onFailed={handleRunFailed}
          onCancelled={handleRunCancelled}
          onError={handleRunError}
        />
      )}

      {/* Spec run status tracker */}
      {specRunId && specPublicToken && (
        <RunStatusTracker
          runId={specRunId}
          accessToken={specPublicToken}
          onCompleted={handleSpecRunCompleted}
          onFailed={handleSpecRunFailed}
          onCancelled={handleSpecRunCancelled}
          onError={handleSpecRunError}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between border-b border-border-default px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-ai" />
          <div>
            <h2 className="text-sm font-semibold text-copy-primary">
              AI Workspace
            </h2>
            <p className="text-xs text-copy-muted">
              Collaborate with Ghost AI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {chatMessages.length > 0 && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => clearChatMessages()}
              aria-label="Clear chat"
              className="text-copy-muted hover:text-copy-primary"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close AI sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="architect" className="flex flex-1 flex-col">
        <div className="px-4 pb-2 pt-3">
          <TabsList className="w-full bg-subtle">
            <TabsTrigger
              value="architect"
              className={cn(
                "flex-1",
                "text-copy-muted",
                "data-[state=active]:bg-accent data-[state=active]:text-accent-foreground",
                "data-[state=active]:shadow-none",
              )}
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className={cn(
                "flex-1",
                "text-copy-muted",
                "data-[state=active]:bg-accent data-[state=active]:text-accent-foreground",
                "data-[state=active]:shadow-none",
              )}
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── AI Architect tab ── */}
        <TabsContent
          value="architect"
          className="flex flex-1 flex-col p-0 m-0"
        >
          {/* Chat area */}
          <ScrollArea className="flex-1 px-4" ref={scrollRef}>
            {/* Chat messages */}
            {chatMessages.map((msg, i) => (
              <div
                key={`${msg.timestamp}-${i}`}
                className={cn(
                  "mt-3 rounded-lg px-3 py-2",
                  msg.role === "user"
                    ? "ml-6 bg-green/15 border border-green/30"
                    : "mr-6 bg-elevated border border-border-default"
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className={cn(
                    "text-xs font-medium",
                    msg.role === "user" ? "text-green" : "text-copy-primary"
                  )}>
                    {msg.sender}
                  </span>
                  <span className="text-[10px] text-copy-faint">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <p className={cn(
                  "text-xs leading-relaxed",
                  msg.role === "user" ? "text-green/90" : "text-copy-secondary"
                )}>
                  {msg.content}
                </p>
              </div>
            ))}

            {/* Send error */}
            {sendError && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
                <p className="text-xs text-red-400">{sendError}</p>
              </div>
            )}

            {/* Empty state — only when no status and no messages */}
            {!feedMessage && !isGenerating && chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bot className="mb-3 h-10 w-10 text-ai" />
                <p className="mb-1 text-sm font-medium text-copy-primary">
                  Ghost AI Architect
                </p>
                <p className="mb-6 text-xs text-copy-muted">
                  Describe your architecture or start with a suggestion below.
                </p>
                <div className="flex flex-col gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={isBusy}
                      className="rounded-full bg-subtle px-4 py-1.5 text-xs text-ai-text transition-colors hover:bg-subtle/80 disabled:opacity-50"
                      onClick={() => handleDesignSubmit(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Input area */}
          <div className="border-t border-border-default p-4">
            {/* Status strip — compact bar above input, only during active runs */}
            {isGenerating && feedMessage && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-green/20 bg-surface px-3 py-2">
                <div className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-green" />
                <span className="text-xs text-copy-muted">
                  {feedMessage.text ?? "AI is working..."}
                </span>
              </div>
            )}

            <div className="relative">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Ghost AI…"
                disabled={isBusy}
                className="min-h-18 max-h-40 resize-none pr-10 text-sm"
              />
              <Button
                size="icon-sm"
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isBusy}
                className="absolute right-2 bottom-2 bg-green text-white hover:bg-green/80"
                aria-label="Send message"
              >
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Specs tab ── */}
        <TabsContent
          value="specs"
          className="flex flex-1 flex-col p-0 m-0"
        >
          <div className="px-4 pt-4">
            <Button
              onClick={handleGenerateSpec}
              disabled={isGeneratingSpec}
              className="w-full bg-brand text-white hover:bg-brand/80"
            >
              {isGeneratingSpec ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isGeneratingSpec ? "Generating…" : "Generate Spec"}
            </Button>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="flex flex-col gap-3 py-4">
              {specsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-ai" />
                </div>
              )}

              {!specsLoading && specs.length === 0 && !isGeneratingSpec && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <FileText className="h-8 w-8 text-copy-faint" />
                  <p className="text-xs text-copy-muted">
                    No specs generated yet
                  </p>
                  <p className="text-[10px] text-copy-faint">
                    Click Generate Spec to create one
                  </p>
                </div>
              )}

              {specs.map((spec) => (
                <div
                  key={spec.id}
                  className="group rounded-lg border border-border-default bg-elevated p-3 transition-colors hover:border-ai/30"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewSpecId(spec.id)}
                    className="flex w-full items-start gap-2 text-left"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ai" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-copy-primary truncate">
                        Technical Specification
                      </p>
                      <p className="text-[10px] text-copy-faint">
                        {formatSpecDate(spec.createdAt)}
                      </p>
                    </div>
                  </button>
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadSpec(spec.id)}
                      className="h-7 text-copy-muted hover:text-copy-primary"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Spec preview modal */}
      {previewSpecId && (
        <SpecPreviewModal
          open={!!previewSpecId}
          onClose={() => setPreviewSpecId(null)}
          specId={previewSpecId}
          projectId={projectId}
          specLabel="Technical Specification"
        />
      )}
    </aside>
  );
}

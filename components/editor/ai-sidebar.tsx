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
  AlertCircle,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  { label: "E-commerce backend", icon: "🛒" },
  { label: "Chat app architecture", icon: "💬" },
  { label: "CI/CD pipeline", icon: "🚀" },
  { label: "Real-time analytics", icon: "📊" },
] as const;

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Subscribes to a Trigger.dev run via useRealtimeRun.
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
 * Slides in from the right. Backdrop closes on click outside.
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
  const {
    feedMessage,
    chatMessages,
    sendChatMessage,
    sendAssistantMessage,
    clearChatMessages,
    chatLoading,
  } = useChatFeed();
  const scrollRef = useRef<HTMLDivElement>(null);

  const isGenerating = isSubmitting || (runId !== null && publicToken !== null);
  const isBusy = isGenerating || chatLoading;

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

      const {
        data: { runId: newRunId },
      } = await specRes.json();

      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: newRunId }),
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to get access token");
      }

      const {
        data: { token },
      } = await tokenRes.json();

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

  const handleRunCompleted = useCallback(() => {
    sendAssistantMessage(
      "Design generated successfully. Check the canvas for updates."
    );
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

  const handleRunError = useCallback((_err: Error) => {
    setSendError("Connection lost. Please try again.");
    setRunId(null);
    setPublicToken(null);
  }, []);

  const handleDesignSubmit = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || isBusy) return;

      const senderName = user?.fullName ?? user?.username ?? "Anonymous";
      setInputValue("");
      setSendError(null);
      setIsSubmitting(true);

      try {
        await sendChatMessage(prompt, senderName);

        const designRes = await fetch("/api/ai/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, roomId, projectId }),
        });

        if (!designRes.ok) {
          const err = await designRes.json().catch(() => ({}));
          throw new Error(err.error || "Failed to start design generation");
        }

        const {
          data: { runId: newRunId },
        } = await designRes.json();

        const tokenRes = await fetch("/api/ai/design/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: newRunId }),
        });

        if (!tokenRes.ok) {
          throw new Error("Failed to get access token");
        }

        const {
          data: { token },
        } = await tokenRes.json();

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
        "fixed right-0 top-0 z-50 flex h-full w-[340px] flex-col",
        "border-l border-border-default/60 bg-elevated/95 shadow-2xl shadow-black/40 backdrop-blur-xl",
        "transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full"
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
      <div className="flex items-start justify-between border-b border-border-default/60 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ai/30 to-brand/30 ring-1 ring-white/10 shadow-md shadow-ai/20">
            <Bot className="h-4 w-4 text-ai-text" />
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-ai opacity-60" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-ai" />
            </span>
          </span>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-copy-primary">
              Ghost AI
            </h2>
            <p className="text-[11px] text-copy-muted">
              Architect &middot; live
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
            className="text-copy-muted hover:text-copy-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="architect" className="flex flex-1 flex-col overflow-hidden">
        <div className="px-3 pt-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="architect">
              <Bot className="h-3.5 w-3.5" />
              Architect
            </TabsTrigger>
            <TabsTrigger value="specs">
              <FileText className="h-3.5 w-3.5" />
              Specs
              {specs.length > 0 && (
                <Badge variant="ghost" size="sm" className="ml-1 text-[9px]">
                  {specs.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── AI Architect tab ── */}
        <TabsContent
          value="architect"
          className="flex flex-1 flex-col overflow-hidden p-0 m-0"
        >
          {/* Chat area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3">
            {/* Chat messages */}
            {chatMessages.map((msg, i) => (
              <div
                key={`${msg.timestamp}-${i}`}
                className={cn(
                  "mt-3 flex flex-col gap-1 rounded-xl border px-3 py-2.5",
                  msg.role === "user"
                    ? "ml-6 border-green/20 bg-green-dim/60"
                    : msg.role === "assistant"
                      ? "mr-6 border-ai/20 bg-ai-dim/50"
                      : "mr-6 border-border-default bg-subtle/60"
                )}
              >
                <div className="mb-0.5 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium",
                      msg.role === "user"
                        ? "text-green"
                        : msg.role === "assistant"
                          ? "text-ai-text"
                          : "text-copy-primary"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <Bot className="h-3 w-3" />
                    )}
                    {msg.sender}
                  </span>
                  <span className="text-[10px] text-copy-faint">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-xs leading-relaxed",
                    msg.role === "user"
                      ? "text-green/95"
                      : "text-copy-secondary"
                  )}
                >
                  {msg.content}
                </p>
              </div>
            ))}

            {/* Send error */}
            {sendError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-error/30 bg-error-dim px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-error" />
                <p className="text-xs leading-relaxed text-error">{sendError}</p>
              </div>
            )}

            {/* Empty state */}
            {!feedMessage && !isGenerating && chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 px-2 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ai/30 to-brand/30 ring-1 ring-white/10 shadow-lg shadow-ai/20">
                  <Bot className="h-6 w-6 text-ai-text" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold tracking-tight text-copy-primary">
                    Describe your system
                  </p>
                  <p className="text-xs leading-relaxed text-copy-muted">
                    Ghost AI will draft the architecture directly on the
                    canvas. Try a starter prompt below.
                  </p>
                </div>
                <div className="grid w-full grid-cols-1 gap-2 pt-1">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt.label}
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDesignSubmit(prompt.label)}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl border border-border-default bg-elevated px-3 py-2 text-left text-xs font-medium text-copy-secondary transition-all duration-200",
                        "hover:-translate-y-0.5 hover:border-brand/40 hover:bg-elevated hover:text-copy-primary hover:shadow-md hover:shadow-brand/10",
                        "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                    >
                      <span className="text-base">{prompt.icon}</span>
                      <span className="flex-1">{prompt.label}</span>
                      <span className="text-copy-faint opacity-0 transition-opacity group-hover:opacity-100">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-border-default/60 p-3">
            {/* Status strip — compact bar above input, only during active runs */}
            {isGenerating && feedMessage && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-ai/30 bg-ai-dim/40 px-3 py-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inset-0 animate-ping rounded-full bg-ai opacity-70" />
                  <span className="relative h-2 w-2 rounded-full bg-ai" />
                </span>
                <span className="text-[11px] leading-relaxed text-copy-secondary">
                  {feedMessage.text ?? "AI is working…"}
                </span>
              </div>
            )}

            <div className="relative">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your architecture…"
                disabled={isBusy}
                className="min-h-12 max-h-40 resize-none pr-12 text-sm"
              />
              <Button
                size="icon-sm"
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isBusy}
                className="absolute right-2 bottom-2 bg-gradient-to-br from-brand to-ai text-white shadow-lg shadow-brand/30 hover:shadow-brand/50"
                aria-label="Send message"
              >
                {isBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <p className="mt-1.5 px-1 text-[10px] text-copy-faint">
              Press <kbd className="rounded border border-border-default bg-elevated px-1 font-mono">Enter</kbd>{" "}
              to send, <kbd className="rounded border border-border-default bg-elevated px-1 font-mono">Shift+Enter</kbd> for newline.
            </p>
          </div>
        </TabsContent>

        {/* ── Specs tab ── */}
        <TabsContent
          value="specs"
          className="flex flex-1 flex-col overflow-hidden p-0 m-0"
        >
          <div className="border-b border-border-default/60 px-4 py-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-copy-primary">
                  Technical specs
                </h3>
                <p className="text-[11px] text-copy-muted">
                  Generated from the current canvas.
                </p>
              </div>
              <Badge variant="ai" size="sm">
                <Sparkles className="h-3 w-3" />
                AI
              </Badge>
            </div>
            <Button
              onClick={handleGenerateSpec}
              disabled={isGeneratingSpec}
              className="group w-full gap-2 shadow-md shadow-brand/15"
            >
              {isGeneratingSpec ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate spec
                  <span className="ml-auto text-[10px] opacity-60">⌘S</span>
                </>
              )}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-3">
            <div className="flex flex-col gap-2 py-3">
              {specsLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-ai" />
                </div>
              )}

              {!specsLoading && specs.length === 0 && !isGeneratingSpec && (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-subtle/60 ring-1 ring-border-default">
                    <FileText className="h-5 w-5 text-copy-faint" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-copy-primary">
                      No specs yet
                    </p>
                    <p className="text-[11px] text-copy-muted">
                      Click <span className="text-brand">Generate spec</span>{" "}
                      above to create one from your canvas.
                    </p>
                  </div>
                </div>
              )}

              {specs.map((spec) => (
                <div
                  key={spec.id}
                  className="group rounded-xl border border-border-default bg-elevated/60 p-3 transition-all hover:-translate-y-0.5 hover:border-ai/30 hover:bg-elevated hover:shadow-md hover:shadow-ai/5"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewSpecId(spec.id)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ai-dim/50 text-ai-text ring-1 ring-ai/20">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-copy-primary">
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
                      className="h-7 gap-1.5 px-2 text-[11px] text-copy-muted hover:text-copy-primary"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

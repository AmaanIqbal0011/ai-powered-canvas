"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SpecPreviewModalProps {
  open: boolean;
  onClose: () => void;
  specId: string;
  projectId: string;
  specLabel: string;
}

function renderMarkdown(content: string): string {
  let html = content
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="rounded-xl bg-surface p-4 text-xs text-copy-primary overflow-x-auto"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="rounded bg-surface px-1.5 py-0.5 text-xs text-brand">$1</code>')
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="mt-6 mb-2 text-sm font-semibold text-copy-primary">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-8 mb-3 text-base font-semibold text-copy-primary">$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-copy-primary">$1</strong>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-xs text-copy-secondary list-disc">$1</li>')
    // Paragraphs (lines that aren't already wrapped)
    .replace(/^(?!<[hlup])((?!^\s*$).+)$/gm, '<p class="mb-2 text-xs leading-relaxed text-copy-secondary">$1</p>');

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    return `<ul class="mb-4 space-y-1">${match}</ul>`;
  });

  return html;
}

export function SpecPreviewModal({
  open,
  onClose,
  specId,
  projectId,
  specLabel,
}: SpecPreviewModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    if (!open || !specId) return;

    setLoading(true);
    setError(null);
    setContent(null);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/specs/${specId}/content`
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load spec");
      }

      const { data } = await res.json();
      setContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load spec");
    } finally {
      setLoading(false);
    }
  }, [open, specId, projectId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleDownload = useCallback(() => {
    const url = `/api/projects/${projectId}/specs/${specId}/download`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `spec-${specId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [projectId, specId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col bg-base border-border-default">
        <DialogHeader className="flex flex-row items-center justify-between gap-4 pr-8">
          <DialogTitle className="flex items-center gap-2 text-copy-primary">
            <FileText className="h-5 w-5 text-ai" />
            {specLabel}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={!content}
            className="text-copy-muted hover:text-copy-primary"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="pb-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-ai" />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {content && (
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiStatusFeedMessage } from "@/types/tasks";

interface AiThinkingIndicatorProps {
  message: AiStatusFeedMessage | null;
  className?: string;
}

/**
 * Small inline status indicator shown in the AI sidebar when
 * generation is active. Displays the latest feed message text
 * with a spinning loader icon.
 */
export function AiThinkingIndicator({
  message,
  className,
}: AiThinkingIndicatorProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border-default bg-elevated px-3 py-2",
        className
      )}
    >
      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-ai" />
      <p className="text-xs text-copy-muted leading-relaxed">
        {message.text ?? "AI is working…"}
      </p>
    </div>
  );
}

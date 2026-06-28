"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useBroadcastEvent,
  useEventListener,
} from "@liveblocks/react";
import type { AiChatMessage } from "@/types/tasks";

/**
 * Real-time chat using Liveblocks broadcast events.
 * Messages are ephemeral (not persisted to feeds) but appear instantly
 * across all connected clients in the room.
 */
export function useAiChat() {
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([]);
  const broadcast = useBroadcastEvent();

  useEventListener(({ event }) => {
    if (event.type === "ai-chat-message") {
      const msg = event.message as AiChatMessage;
      setChatMessages((prev) => [...prev, msg]);
    }
  });

  const sendMessage = useCallback(
    async (content: string, sender: string) => {
      const message: AiChatMessage = {
        sender,
        role: "user",
        content,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, message]);
      broadcast({ type: "ai-chat-message", message });
      return true;
    },
    [broadcast]
  );

  const sendAssistantMessage = useCallback(
    async (content: string) => {
      const message: AiChatMessage = {
        sender: "Ghost AI",
        role: "assistant",
        content,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, message]);
      broadcast({ type: "ai-chat-message", message });
      return true;
    },
    [broadcast]
  );

  const clearMessages = useCallback(() => {
    setChatMessages([]);
  }, []);

  return {
    chatMessages,
    sendMessage,
    sendAssistantMessage,
    clearMessages,
    isLoading: false,
    error: null,
  };
}

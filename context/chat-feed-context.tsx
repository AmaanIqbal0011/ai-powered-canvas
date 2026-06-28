"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAiFeed } from "@/hooks/use-ai-feed";
import { useAiChat } from "@/hooks/use-ai-chat";
import type { AiStatusFeedMessage } from "@/types/tasks";
import type { AiChatMessage } from "@/types/tasks";

interface ChatFeedContextValue {
  // Status feed
  feedMessage: AiStatusFeedMessage | null;
  clearFeedMessage: () => void;

  // Chat feed
  chatMessages: AiChatMessage[];
  sendChatMessage: (content: string, sender: string) => Promise<boolean>;
  sendAssistantMessage: (content: string) => Promise<boolean>;
  clearChatMessages: () => void;
  chatLoading: boolean;
}

const ChatFeedContext = createContext<ChatFeedContextValue | null>(null);

/**
 * Provider that runs Liveblocks feed hooks inside RoomProvider scope
 * and exposes the data to any descendant (including the AI sidebar).
 *
 * Must be rendered inside a Liveblocks RoomProvider.
 */
export function ChatFeedProvider({ children }: { children: ReactNode }) {
  const { latestMessage: feedMessage, clearMessage: clearFeedMessage } =
    useAiFeed();
  const {
    chatMessages,
    sendMessage: sendChatMessage,
    sendAssistantMessage,
    clearMessages: clearChatMessages,
    isLoading: chatLoading,
  } = useAiChat();

  return (
    <ChatFeedContext.Provider
      value={{
        feedMessage,
        clearFeedMessage,
        chatMessages,
        sendChatMessage,
        sendAssistantMessage,
        clearChatMessages,
        chatLoading,
      }}
    >
      {children}
    </ChatFeedContext.Provider>
  );
}

/**
 * Read chat feed data from the context.
 * Must be used inside a ChatFeedProvider (which must be inside RoomProvider).
 */
export function useChatFeed() {
  const ctx = useContext(ChatFeedContext);
  if (!ctx) {
    throw new Error("useChatFeed must be used inside a ChatFeedProvider");
  }
  return ctx;
}

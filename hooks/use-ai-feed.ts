"use client";

import { useEffect, useState, useCallback } from "react";
import { useFeedMessages, useCreateFeed } from "@liveblocks/react";
import {
  AI_STATUS_FEED_ID,
  AiStatusFeedMessageSchema,
  type AiStatusFeedMessage,
} from "@/types/tasks";

/**
 * Subscribes to the `ai-status-feed` Liveblocks feed and returns the most
 * recent validated message. Creates the feed automatically if it doesn't exist.
 *
 * Only the latest message is shown — no full feed history.
 */
export function useAiFeed() {
  const [latestMessage, setLatestMessage] = useState<AiStatusFeedMessage | null>(null);
  const createFeed = useCreateFeed();

  const { messages, error, isLoading } = useFeedMessages(AI_STATUS_FEED_ID, {
    limit: 5,
  });

  // Ensure the feed exists on first mount
  useEffect(() => {
    createFeed(AI_STATUS_FEED_ID, { metadata: { name: "AI Status" } }).catch(
      () => {
        // Feed may already exist — that's fine
      }
    );
  }, [createFeed]);

  // Parse and validate the latest feed message
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const latest = messages[messages.length - 1];
    const parsed = AiStatusFeedMessageSchema.safeParse(latest.data);

    if (parsed.success) {
      setLatestMessage(parsed.data);
    } else {
      console.warn("[useAiFeed] Invalid feed message:", parsed.error);
    }
  }, [messages]);

  const clearMessage = useCallback(() => {
    setLatestMessage(null);
  }, []);

  return {
    latestMessage,
    clearMessage,
    isLoading,
    error,
  };
}

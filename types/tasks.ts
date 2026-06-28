import { z } from "zod";

// ── AI Status Feed Payload Schema ───────────────────────────────────────────

/**
 * Payload schema for messages posted to the `ai-status-feed` Liveblocks feed.
 *
 * Used by both the server (design agent posts status) and the client
 * (sidebar subscribes and validates incoming messages).
 */
export const AiStatusFeedMessageSchema = z.object({
  text: z.string().optional(),
  phase: z
    .enum(["analyzing", "generating", "placing", "complete", "failed"])
    .optional(),
  runId: z.string().optional(),
});

export type AiStatusFeedMessage = z.infer<typeof AiStatusFeedMessageSchema>;

/**
 * Feed ID constant used across server and client.
 */
export const AI_STATUS_FEED_ID = "ai-status-feed";

// ── AI Chat Feed Payload Schema ─────────────────────────────────────────────

/**
 * Payload schema for messages posted to the `ai-chat` Liveblocks feed.
 *
 * Used for collaborative sidebar chat between room participants.
 * Separate from `ai-status-feed`, which handles AI progress updates.
 */
export const AiChatMessageSchema = z.object({
  sender: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  timestamp: z.number(),
});

export type AiChatMessage = z.infer<typeof AiChatMessageSchema>;

/**
 * Feed ID for the collaborative sidebar chat.
 */
export const AI_CHAT_FEED_ID = "ai-chat";

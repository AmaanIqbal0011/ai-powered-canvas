// Liveblocks types for realtime collaboration
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data

import { LiveObject, LiveMap } from "@liveblocks/core";
import type { AiStatusFeedMessage, AiChatMessage } from "@/types/tasks";

declare global {
  interface Liveblocks {
    // Each user's Presence — broadcast to all room participants
    Presence: {
      cursor: { x: number; y: number } | null;
      isThinking: boolean;
    };

    // The Storage tree for the room — includes the React Flow flow managed
    // by useLiveblocksFlow at the default storage key "flow".
    Storage: {
      flow: LiveObject<{
        nodes: LiveMap<string, LiveObject<Record<string, any>>>;
        edges: LiveMap<string, LiveObject<Record<string, any>>>;
      }>;
    };

    // Custom user info set when authenticating via the auth endpoint
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent:
      | {
          type: "ai-status";
          message: string;
          timestamp: string;
        }
      | {
          type: "ai-chat-message";
          message: AiChatMessage;
        };

    // Custom metadata set on threads
    ThreadMetadata: {};

    // Custom room info set with resolveRoomsInfo
    RoomInfo: {};

    // Feed types — used by useFeeds, useFeedMessages, useCreateFeed, useCreateFeedMessage
    Feed: {
      "ai-status-feed": {
        name: string;
      };
      "ai-chat": {
        name: string;
      };
    };

    FeedMessage: {
      "ai-status-feed": AiStatusFeedMessage;
      "ai-chat": AiChatMessage;
    };
  }
}

export {};

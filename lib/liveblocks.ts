import { Liveblocks } from "@liveblocks/node";

/**
 * Cached Liveblocks server-side client.
 *
 * Uses the private key from environment variables to authenticate
 * with Liveblocks for room management and issuing ID tokens.
 */
const globalForLiveblocks = globalThis as unknown as {
  liveblocks: Liveblocks | undefined;
};

function createLiveblocksClient(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_PRIVATE_KEY;

  if (!secret) {
    throw new Error(
      "LIVEBLOCKS_PRIVATE_KEY is not set. Add it to your .env file."
    );
  }

  return new Liveblocks({ secret });
}

export const liveblocks =
  globalForLiveblocks.liveblocks ?? createLiveblocksClient();

if (process.env.NODE_ENV !== "production") {
  globalForLiveblocks.liveblocks = liveblocks;
}

/**
 * Deterministic cursor color palette.
 *
 * Maps a user ID to a consistent color from a fixed set of 10 colors,
 * ensuring each user always sees the same cursor color across sessions.
 */

const CURSOR_COLORS = [
  "#ff6b6b",
  "#ffa94d",
  "#ffd43b",
  "#69db7c",
  "#38d9a9",
  "#4dabf7",
  "#748ffc",
  "#9775fa",
  "#da77f2",
  "#f06595",
];

export function getCursorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

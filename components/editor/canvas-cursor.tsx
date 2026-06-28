"use client";

// Liveblocks UI styles for the Cursor component
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-ui/styles/dark/attributes.css";

import { Cursors } from "@liveblocks/react-flow";
import type { CursorsCursorProps } from "@liveblocks/react-ui";
import { Cursor } from "@liveblocks/react-ui";
import { useOther } from "@liveblocks/react";
import { Loader2 } from "lucide-react";

/**
 * Custom cursor component for the Liveblocks React Flow canvas.
 *
 * Renders a compact 18px colored pointer with a name badge, sized for the
 * canvas viewport. Reads user info (name + color) and thinking state
 * directly from the room connection data via `useOther(connectionId, selector)`.
 * When a participant has `isThinking: true`, a small spinner appears
 * in the cursor name badge.
 */
function CanvasCursorContent({ connectionId }: CursorsCursorProps) {
  const info = useOther(connectionId, (other) => other.info);
  const isThinking = useOther(connectionId, (other) => other.presence.isThinking);

  if (!info) return null;

  return (
    <Cursor
      label={
        <span className="flex items-center gap-1">
          {info.name ?? "Anonymous"}
          {isThinking ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
          ) : null}
        </span>
      }
      color={info.color}
      className="[--lb-cursor-size:18px]"
    />
  );
}

/**
 * Cursors wrapper that passes the custom cursor component to Liveblocks.
 *
 * Drop this into the React Flow children slot in place of the default <Cursors />.
 */
export function CanvasCursors() {
  return <Cursors components={{ Cursor: CanvasCursorContent }} />;
}

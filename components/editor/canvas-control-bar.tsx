"use client";

import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
} from "@liveblocks/react";
import {
  ZoomIn,
  ZoomOut,
  Focus,
  Undo,
  Redo,
} from "lucide-react";

/**
 * Floating control bar for zoom and undo/redo.
 *
 * Renders as a pill-shaped bar at the bottom-left of the canvas, above the
 * shape panel. Zoom controls use the React Flow instance; undo/redo use
 * Liveblocks history.
 */
export function CanvasControlBar() {
  const reactFlowInstance = useReactFlow();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  // ── Zoom handlers ──────────────────────────────────────────────────────

  const zoomIn = useCallback(() => {
    reactFlowInstance.zoomIn({ duration: 200 });
  }, [reactFlowInstance]);

  const zoomOut = useCallback(() => {
    reactFlowInstance.zoomOut({ duration: 200 });
  }, [reactFlowInstance]);

  const fitView = useCallback(() => {
    reactFlowInstance.fitView({ duration: 200 });
  }, [reactFlowInstance]);

  // ── Button style helpers ───────────────────────────────────────────────

  const baseButton =
    "flex h-8 w-8 items-center justify-center rounded-md text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary disabled:opacity-30 disabled:pointer-events-none";
  const iconClass = "h-4 w-4";

  return (
    <div className="pointer-events-none absolute bottom-6 left-6 z-10">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border-default bg-elevated px-3 py-2 shadow-lg">
        {/* Zoom controls */}
        <button
          onClick={zoomOut}
          className={baseButton}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut className={iconClass} />
        </button>
        <button
          onClick={fitView}
          className={baseButton}
          title="Fit view"
          aria-label="Fit view"
        >
          <Focus className={iconClass} />
        </button>
        <button
          onClick={zoomIn}
          className={baseButton}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className={iconClass} />
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-border-default" />

        {/* History controls */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={baseButton}
          title="Undo"
          aria-label="Undo"
        >
          <Undo className={iconClass} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={baseButton}
          title="Redo"
          aria-label="Redo"
        >
          <Redo className={iconClass} />
        </button>
      </div>
    </div>
  );
}

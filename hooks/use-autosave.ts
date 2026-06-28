"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSaveStatus } from "@/context/save-status-context";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

/**
 * Autosave hook for the collaborative canvas.
 *
 * Watches the canvas nodes and edges, debounces changes, and saves
 * the full canvas state to Vercel Blob via the canvas API route.
 *
 * Tracks save status (saving / saved / error) through SaveStatusContext
 * so the navbar can display the current state.
 *
 * Returns a `save` function for manual save triggering from the navbar.
 *
 * @param roomId - The project / room ID to save under.
 * @param nodes  - Current canvas nodes from useLiveblocksFlow.
 * @param edges  - Current canvas edges from useLiveblocksFlow.
 */
export function useAutosave(
  roomId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
) {
  const { updateStatus } = useSaveStatus();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Keep refs for latest values so the stable save() callback always
  // uses the most current roomId, nodes, and edges.
  const roomIdRef = useRef(roomId);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  roomIdRef.current = roomId;
  nodesRef.current = nodes;
  edgesRef.current = edges;

  /**
   * Persist the current canvas state to Vercel Blob.
   * Shared between the debounced autosave effect and manual save.
   */
  const save = useCallback(async () => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    if (currentNodes.length === 0 && currentEdges.length === 0) return;

    updateStatus("saving");

    try {
      const response = await fetch(
        `/api/projects/${roomIdRef.current}/canvas`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodes: currentNodes,
            edges: currentEdges,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Save failed (${response.status})`);
      }

      updateStatus("saved");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save canvas";
      updateStatus("error", message);
    }
  }, [updateStatus]);

  // Debounced autosave on node/edge changes
  useEffect(() => {
    // Skip the initial render to avoid saving during data load.
    // Subsequent changes to nodes/edges will trigger autosave.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // If both arrays are empty there is nothing to save.
    if (nodes.length === 0 && edges.length === 0) return;

    // Clear any pending debounced save
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Schedule a save 2 seconds after the last change
    debounceRef.current = setTimeout(save, 2000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [nodes, edges, save]);

  return { save };
}

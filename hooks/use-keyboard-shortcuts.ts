"use client";

import { useEffect, useCallback } from "react";
import {
  useNodes,
  useEdges,
  type ReactFlowInstance,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";

import type { CanvasNode, CanvasEdge } from "@/types/canvas";

/**
 * Canvas keyboard shortcuts hook.
 *
 * Listens for keyboard shortcuts on `window` and ignores them when the user
 * is typing in an input, textarea, or contenteditable element.
 *
 * Supported shortcuts:
 * - `+` / `=` — zoom in
 * - `-` — zoom out
 * - `Delete` / `Backspace` — delete selected nodes and edges
 * - `Cmd/Ctrl + Z` — undo
 * - `Cmd/Ctrl + Shift + Z` — redo
 * - `Cmd/Ctrl + Y` — redo
 */
export function useKeyboardShortcuts(
  reactFlowInstance: ReactFlowInstance | null,
  undo: () => void,
  redo: () => void,
  onNodesChange?: OnNodesChange<CanvasNode>,
  onEdgesChange?: OnEdgesChange<CanvasEdge>,
) {
  const nodes = useNodes<CanvasNode>();
  const edges = useEdges<CanvasEdge>();

  const deleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    const selectedEdges = edges.filter((e) => e.selected);

    if (selectedNodes.length > 0 && onNodesChange) {
      onNodesChange(
        selectedNodes.map((n) => ({ type: "remove" as const, id: n.id })),
      );
    }

    if (selectedEdges.length > 0 && onEdgesChange) {
      onEdgesChange(
        selectedEdges.map((e) => ({ type: "remove" as const, id: e.id })),
      );
    }
  }, [nodes, edges, onNodesChange, onEdgesChange]);

  useEffect(() => {
    if (!reactFlowInstance) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts when the user is typing in an editable field
      const target = event.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        target.isContentEditable
      ) {
        return;
      }

      // Delete / Backspace — delete selected nodes and edges
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelected();
        return;
      }

      const isMod = event.metaKey || event.ctrlKey;

      // Zoom in: + or =
      if (event.key === "+" || event.key === "=") {
        if (!isMod) {
          event.preventDefault();
          reactFlowInstance.zoomIn({ duration: 200 });
        }
        return;
      }

      // Zoom out: -
      if (event.key === "-") {
        if (!isMod) {
          event.preventDefault();
          reactFlowInstance.zoomOut({ duration: 200 });
        }
        return;
      }

      // Undo: Cmd/Ctrl + Z
      if (isMod && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if (
        (isMod && event.key === "z" && event.shiftKey) ||
        (isMod && event.key === "y")
      ) {
        event.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reactFlowInstance, undo, redo, deleteSelected]);
}

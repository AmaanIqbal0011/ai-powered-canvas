"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { useMutation } from "@liveblocks/react";

import type { CanvasEdge } from "@/types/canvas";

/**
 * Custom canvas edge renderer with clean smoothstep routing, inline label
 * editing, and improved hit area for easier interaction.
 *
 * Visual behavior:
 * - Dimmed stroke (#3a3a42) at rest, bright (#f8fafc) on hover or selection
 * - Arrowhead color follows the stroke color dynamically
 * - An invisible wider path (20px) sits behind the visible line so hover
 *   and click targets are comfortable without increasing visible thickness
 *
 * Label behavior:
 * - Double-click the edge path or the label pill to enter edit mode
 * - A text input grows with the label content (min-width 30px)
 * - Blur, Enter: save label to Liveblocks Storage
 * - Escape: revert and discard
 * - Saved labels render as small pill badges
 * - When the edge is active but has no label, show a faint dashed hint
 * - Label interactions stop propagation to prevent canvas drag/pan
 */
function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
  selected,
}: EdgeProps<CanvasEdge>) {
  const label = data?.label ?? "";

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute the smoothstep path and midpoint coordinates for label placement.
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = selected || isHovered;
  const strokeColor = isActive ? "#f8fafc" : "#3a3a42";

  // Sync local state when label changes from collaborators (not during edit).
  useEffect(() => {
    if (!isEditing) {
      setEditLabel(label);
    }
  }, [label, isEditing]);

  // â”€â”€ Liveblocks mutation: update edge label â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const updateLabel = useMutation(
    ({ storage }, edgeId: string, newLabel: string) => {
      const flow = storage.get("flow");
      const edges = flow.get("edges");
      const edge = edges.get(edgeId);
      if (edge) {
        const data = edge.get("data");
        // data is a LiveObject u2014 update only the label field directly,
        // preserving all other fields without replacing
        if (typeof data === "object" && data !== null && "set" in data) {
          (data as unknown as { set(key: string, value: unknown): void }).set("label", newLabel);
        }
      }
    },
    [],
  );

  // â”€â”€ Edit handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditLabel(label);
  }, [label]);

  const closeEditing = useCallback(() => {
    setIsEditing(false);
    if (editLabel !== label) {
      updateLabel(id, editLabel);
    }
  }, [editLabel, label, id, updateLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditLabel(label);
        setIsEditing(false);
      } else if (e.key === "Enter") {
        closeEditing();
      }
    },
    [label, closeEditing],
  );

  // Sync keystrokes to Liveblocks in real-time for collaboration.
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditLabel(e.target.value);
      updateLabel(id, e.target.value);
    },
    [id, updateLabel],
  );

  // Auto-focus the input when editing starts.
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Prevent label interactions from dragging or panning the canvas.
  const stopPropagation = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
    },
    [],
  );

  return (
    <>
      {/* Arrow marker definitions â€” matched to dim/bright stroke states */}
      <defs>
        <marker
          id="edge-arrow-dim"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#3a3a42" />
        </marker>
        <marker
          id="edge-arrow-bright"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f8fafc" />
        </marker>
      </defs>

      {/* Invisible wider hit path for easier hover and click targeting */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={handleDoubleClick}
      />

      {/* Visible edge path */}
      <BaseEdge
        path={edgePath}
        markerEnd={`url(#edge-arrow-${isActive ? "bright" : "dim"})`}
        style={{
          stroke: strokeColor,
          strokeWidth: 1.5,
          transition: "stroke 0.12s ease",
        }}
      />

      {/* â•â• Edge label overlay â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
            zIndex: 10,
          }}
          onMouseDown={stopPropagation}
          onMouseMove={stopPropagation}
          onTouchStart={stopPropagation}
          onDoubleClick={isEditing ? undefined : handleDoubleClick}
          className="nodrag nopan"
        >
          {isEditing ? (
            // â”€â”€ Inline edit input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            <input
              ref={inputRef}
              value={editLabel}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={closeEditing}
              size={Math.max(editLabel.length || 1, 4)}
              className="nodrag nopan rounded border border-brand bg-base px-1.5 py-0.5 text-center text-xs outline-none"
              style={{
                color: "#f8fafc",
                minWidth: 30,
                maxWidth: 200,
              }}
              aria-label="Edge label"
            />
          ) : label ? (
            // â”€â”€ Saved label pill â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            <span
              className={`nodrag nopan rounded-full px-2 py-0.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-elevated text-copy-primary shadow-sm"
                  : "bg-elevated/80 text-copy-muted"
              }`}
            >
              {label}
            </span>
          ) : isActive ? (
            // â”€â”€ Faint hint when active and no label â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            <span className="nodrag nopan cursor-pointer rounded-full border border-dashed border-border-default bg-elevated/60 px-2 py-0.5 text-xs text-copy-muted/50">
              Add label
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default CanvasEdgeComponent;


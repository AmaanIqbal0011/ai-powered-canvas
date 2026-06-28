"use client";

import {
  memo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  Handle,
  Position,
  NodeResizer,
  type NodeProps,
} from "@xyflow/react";
import { useMutation } from "@liveblocks/react";

import type { CanvasNode, CanvasNodeShape } from "@/types/canvas";
import { SHAPE_DEFAULT_SIZES } from "@/types/canvas";
import {
  ShapeRenderer,
  getTextColorForFill,
} from "@/components/editor/shape-renderer";
import { ColorToolbar } from "@/components/editor/color-toolbar";

/**
 * Custom canvas node renderer with shape-specific visuals, resize handles,
 * and inline label editing.
 *
 * - rectangle, pill, circle: rendered as CSS-styled divs
 * - diamond, hexagon, cylinder: rendered as inline SVGs that scale
 *   with the node size
 *
 * Borders are subtle at rest (`--border-default`) and brighter
 * (brand cyan) when the node is selected.
 *
 * Connection handles appear on all four sides, hidden by default,
 * revealed on node hover.
 *
 * Resize handles (via `<NodeResizer>`) appear when the node is selected,
 * with a minimum size of 80x60 to prevent collapsing nodes.
 *
 * Double-click the node label area to enter inline editing mode.
 */
const CanvasNodeComponent = memo(function CanvasNodeComponent({
  id: nodeId,
  data,
  selected,
  width: nodeWidth,
  height: nodeHeight,
}: NodeProps<CanvasNode>) {
  const { label, color, shape } = data;

  const stroke = selected ? "#00c8d4" : "#2a2a30";
  const strokeWidth = selected ? 2 : 1.5;
  const textColor = getTextColorForFill(color);

  // Use provided node dimensions or fall back to shape defaults
  const safeShape = (shape as CanvasNodeShape) ?? "rectangle";
  const w =
    nodeWidth ?? SHAPE_DEFAULT_SIZES[safeShape]?.width ?? 180;
  const h =
    nodeHeight ?? SHAPE_DEFAULT_SIZES[safeShape]?.height ?? 100;

  // â”€â”€ Inline label editing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update node label in Liveblocks Storage
  const updateLabel = useMutation(
    ({ storage }, id: string, newLabel: string) => {
      const flow = storage.get("flow");
      const nodes = flow.get("nodes");
      const node = nodes.get(id);
      if (node) {
        const data = node.get("data");
        // data is a LiveObject u2014 update only the label field directly,
        // preserving all other fields (shape, color, etc.) without replacing
        if (typeof data === "object" && data !== null && "set" in data) {
          (data as unknown as { set(key: string, value: unknown): void }).set("label", newLabel);
        }
      }
    },
    [],
  );

  // Enter edit mode on double-click
  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditLabel(label);
  }, [label]);

  // Auto-focus the textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Commit changes and exit edit mode
  const closeEditing = useCallback(() => {
    setIsEditing(false);
    if (editLabel !== label) {
      updateLabel(nodeId, editLabel);
    }
  }, [editLabel, label, nodeId, updateLabel]);

  // Handle Escape key â€” revert and close, blur handled by closeEditing
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        // Revert to original label and close without saving
        setEditLabel(label);
        setIsEditing(false);
      }
    },
    [label],
  );

  // Update local edit state and Liveblocks as the user types
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newLabel = e.target.value;
      setEditLabel(newLabel);
      updateLabel(nodeId, newLabel);
    },
    [nodeId, updateLabel],
  );

  // Prevent text editing interactions from dragging or panning the canvas
  const preventDragOnEdit = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isEditing) {
        e.stopPropagation();
      }
    },
    [isEditing],
  );

  return (
    <div
      className="group relative"
      style={{ width: w, height: h }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Resize handles â€” visible only when the node is selected */}
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={60}
        handleStyle={{
          fill: "#00c8d4",
          width: 7,
          height: 7,
          borderRadius: 2,
          cursor: "crosshair",
        }}
        lineStyle={{
          stroke: "#00c8d4",
          strokeWidth: 1,
          strokeDasharray: "3 3",
        }}
      />

      {/* Top handle â€” both source and target so connections can enter or leave from the top */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="h-2! w-2! border-0! bg-white! opacity-0! transition-opacity! group-hover:opacity-100!"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="h-2! w-2! border-0! bg-white! opacity-0! transition-opacity! group-hover:opacity-100!"
      />

      {/* Left handle â€” both source and target */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="h-2! w-2! border-0! bg-white! opacity-0! transition-opacity! group-hover:opacity-100!"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="h-2! w-2! border-0! bg-white! opacity-0! transition-opacity! group-hover:opacity-100!"
      />

      <ShapeRenderer
        shape={safeShape}
        fill={color}
        stroke={stroke}
        strokeWidth={strokeWidth}
        label={isEditing ? editLabel : label}
        textColor={textColor}
        width={w}
        height={h}
      />

      {/* Color toolbar â€” floating above the node when selected */}
      {selected && (
        <ColorToolbar
          nodeId={nodeId}
          currentColor={color}
        />
      )}

      {/* Placeholder text when label is empty and not editing */}
      {!isEditing && !label && (
        <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center">
          <span
            className="text-xs opacity-40"
            style={{ color: textColor }}
          >
            Add a label
          </span>
        </div>
      )}

      {/* Inline label editing textarea â€” appears on top of the shape */}
      {isEditing && (
        <textarea
          ref={textareaRef}
          value={editLabel}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={closeEditing}
          onMouseDown={preventDragOnEdit}
          onMouseMove={preventDragOnEdit}
          onTouchStart={preventDragOnEdit}
          placeholder="Add a labelâ€¦"
          className="absolute inset-0 resize-none overflow-hidden bg-transparent text-center text-sm leading-tight outline-none"
          style={{
            color: textColor,
            fontFamily:
              "Geist Sans, ui-sans-serif, sans-serif",
          }}
          aria-label="Node label"
        />
      )}

      {/* Right handle â€” both source and target */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="h-2! w-2! border-0! bg-white! opacity-0! transition-opacity! group-hover:opacity-100!"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="h-2! w-2! border-0! bg-white! opacity-0! transition-opacity! group-hover:opacity-100!"
      />

      {/* Bottom handle â€” both source and target */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="h-2! w-2! border-0! bg-white! opacity-0! transition-opacity! group-hover:opacity-100!"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="h-2! w-2! border-0! bg-white! opacity-0! transition-opacity! group-hover:opacity-100!"
      />
    </div>
  );
});

export default CanvasNodeComponent;


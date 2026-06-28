import type { Node, Edge } from "@xyflow/react";

/**
 * Data attached to every canvas node.
 */
export interface CanvasNodeData {
  label: string;
  color: string;
  shape: CanvasNodeShape;
  [key: string]: unknown;
}

/**
 * Supported node shapes.
 *
 * Complex shapes (diamond, hexagon, cylinder) are rendered as inline SVGs
 * rather than CSS borders.
 */
export type CanvasNodeShape =
  | "rectangle"
  | "diamond"
  | "circle"
  | "pill"
  | "cylinder"
  | "hexagon";

/**
 * Custom node type for the canvas.
 */
export type CanvasNode = Node<CanvasNodeData, "canvasNode">;

/**
 * Data attached to every canvas edge.
 */
export interface CanvasEdgeData {
  label?: string;
  [key: string]: unknown;
}

/**
 * Custom edge type for the canvas.
 */
export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">;

/**
 * Registered custom node and edge type keys.
 */
export const CANVAS_NODE_TYPE = "canvasNode" as const;
export const CANVAS_EDGE_TYPE = "canvasEdge" as const;

/**
 * Node color palette — 8 color pairs.
 *
 * Each pair specifies a dark node fill and a vivid contrasting text color
 * tuned for readability on the dark canvas background.
 */
export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" }, // Neutral dark (default)
  { fill: "#10233D", text: "#52A8FF" }, // Blue
  { fill: "#2E1938", text: "#BF7AF0" }, // Purple
  { fill: "#331B00", text: "#FF990A" }, // Orange
  { fill: "#3C1618", text: "#FF6166" }, // Red
  { fill: "#3A1726", text: "#F75F8F" }, // Pink
  { fill: "#0F2E18", text: "#62C073" }, // Green
  { fill: "#062822", text: "#0AC7B4" }, // Teal
] as const;

/**
 * Supported node shapes with metadata.
 */
export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const satisfies readonly CanvasNodeShape[];

/** Default node color index (neutral dark). */
export const DEFAULT_NODE_COLOR_INDEX = 0;

/**
 * Default dimensions for each shape when dropped on the canvas.
 *
 * Rectangles are wider than tall, circles are square, diamonds are
 * slightly larger to leave room for labels.
 */
export const SHAPE_DEFAULT_SIZES: Record<
  CanvasNodeShape,
  { width: number; height: number }
> = {
  rectangle: { width: 180, height: 100 },
  diamond: { width: 160, height: 160 },
  circle: { width: 120, height: 120 },
  pill: { width: 160, height: 80 },
  cylinder: { width: 150, height: 100 },
  hexagon: { width: 160, height: 140 },
};

/**
 * Drag payload transferred when a shape is dragged from the shape panel
 * onto the canvas.
 */
export interface ShapeDragData {
  shape: CanvasNodeShape;
  width: number;
  height: number;
}

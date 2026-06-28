"use client";

import type { CanvasNodeShape } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";

// ── Text color lookup ──────────────────────────────────────────────────────

/**
 * Resolve the display text color for a given node fill color.
 * Falls back to light text if the fill isn't in the palette.
 */
export function getTextColorForFill(fill: string): string {
  const pair = NODE_COLORS.find((c) => c.fill === fill);
  return pair?.text ?? "#EDEDED";
}

// ── Props ──────────────────────────────────────────────────────────────────

interface ShapeRendererProps {
  shape: CanvasNodeShape;
  fill: string;
  stroke: string;
  strokeWidth?: number;
  label?: string;
  textColor?: string;
  width: number;
  height: number;
}

// ── CSS shapes (rectangle, pill, circle) ──────────────────────────────────

function RectShape({
  fill,
  stroke,
  strokeWidth,
  label,
  textColor,
  width,
  height,
}: ShapeRendererProps) {
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-xl overflow-hidden px-3 py-2"
      style={{
        backgroundColor: fill,
        border: `${strokeWidth}px solid ${stroke}`,
        color: textColor,
        width,
        height,
      }}
    >
      <span className="select-none text-center text-sm leading-tight">
        {label}
      </span>
    </div>
  );
}

function PillShape({
  fill,
  stroke,
  strokeWidth,
  label,
  textColor,
  width,
  height,
}: ShapeRendererProps) {
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-full overflow-hidden px-4 py-2"
      style={{
        backgroundColor: fill,
        border: `${strokeWidth}px solid ${stroke}`,
        color: textColor,
        width,
        height,
      }}
    >
      <span className="select-none text-center text-sm leading-tight">
        {label}
      </span>
    </div>
  );
}

function CircleShape({
  fill,
  stroke,
  strokeWidth,
  label,
  textColor,
  width,
  height,
}: ShapeRendererProps) {
  const size = Math.min(width, height);
  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{ width, height }}
    >
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          width: size,
          height: size,
          backgroundColor: fill,
          border: `${strokeWidth}px solid ${stroke}`,
          color: textColor,
          borderRadius: "50%",
        }}
      >
        <span className="select-none text-center text-sm leading-tight px-1 line-clamp-3">
          {label}
        </span>
      </div>
    </div>
  );
}

// ── SVG shapes (diamond, hexagon, cylinder) ────────────────────────────────

function DiamondShape({
  fill,
  stroke,
  strokeWidth,
  label,
  textColor,
  width,
  height,
}: ShapeRendererProps) {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ width, height }}>
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
      >
        <polygon
          points="50,5 95,50 50,95 5,50"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        {label && (
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            fill={textColor}
            fontSize="14"
            fontFamily="Geist Sans, ui-sans-serif, sans-serif"
            className="select-none"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}

function HexagonShape({
  fill,
  stroke,
  strokeWidth,
  label,
  textColor,
  width,
  height,
}: ShapeRendererProps) {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ width, height }}>
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
      >
        <polygon
          points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        {label && (
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            fill={textColor}
            fontSize="14"
            fontFamily="Geist Sans, ui-sans-serif, sans-serif"
            className="select-none"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}

function CylinderShape({
  fill,
  stroke,
  strokeWidth,
  label,
  textColor,
  width,
  height,
}: ShapeRendererProps) {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ width, height }}>
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
      >
        {/* Top ellipse cap */}
        <ellipse
          cx="50"
          cy="22"
          rx="38"
          ry="12"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        {/* Body + bottom curve (top line is hidden behind the ellipse) */}
        <path
          d="M 12,22 L 12,78 A 38,12 0 0,0 88,78 L 88,22 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        {label && (
          <text
            x="50"
            y="55"
            textAnchor="middle"
            dominantBaseline="central"
            fill={textColor}
            fontSize="14"
            fontFamily="Geist Sans, ui-sans-serif, sans-serif"
            className="select-none"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}

// ── Composite ──────────────────────────────────────────────────────────────

/**
 * Render a canvas node shape with the given fill, stroke, and label.
 *
 * CSS shapes (rectangle, pill, circle) use native divs with border-radius.
 * SVG shapes (diamond, hexagon, cylinder) render inline SVGs that scale
 * to the available width/height.
 */
export function ShapeRenderer(props: ShapeRendererProps) {
  switch (props.shape) {
    case "rectangle":
      return <RectShape {...props} />;
    case "pill":
      return <PillShape {...props} />;
    case "circle":
      return <CircleShape {...props} />;
    case "diamond":
      return <DiamondShape {...props} />;
    case "hexagon":
      return <HexagonShape {...props} />;
    case "cylinder":
      return <CylinderShape {...props} />;
    default:
      return <RectShape {...props} />;
  }
}

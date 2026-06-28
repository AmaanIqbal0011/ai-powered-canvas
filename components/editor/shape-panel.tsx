"use client";

import { useCallback } from "react";
import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
} from "lucide-react";

import type { CanvasNodeShape, ShapeDragData } from "@/types/canvas";
import { SHAPE_DEFAULT_SIZES, NODE_COLORS, DEFAULT_NODE_COLOR_INDEX } from "@/types/canvas";

// ── Shape items ────────────────────────────────────────────────────────────

interface ShapeItem {
  shape: CanvasNodeShape;
  icon: React.ReactNode;
  label: string;
}

const SHAPE_ITEMS: ShapeItem[] = [
  {
    shape: "rectangle",
    icon: <RectangleHorizontal className="h-4 w-4" />,
    label: "Rectangle",
  },
  {
    shape: "diamond",
    icon: <Diamond className="h-4 w-4" />,
    label: "Diamond",
  },
  {
    shape: "circle",
    icon: <Circle className="h-4 w-4" />,
    label: "Circle",
  },
  {
    shape: "pill",
    icon: <Pill className="h-4 w-4" />,
    label: "Pill",
  },
  {
    shape: "cylinder",
    icon: <Cylinder className="h-4 w-4" />,
    label: "Cylinder",
  },
  {
    shape: "hexagon",
    icon: <Hexagon className="h-4 w-4" />,
    label: "Hexagon",
  },
];

// ── Drag ghost helper ──────────────────────────────────────────────────────

/**
 * Build an offscreen DOM element styled to match the given shape and size.
 *
 * Used as the drag image via `setDragImage` so the browser shows a shape
 * preview attached to the cursor rather than the small icon button.
 */
function createShapeGhost(
  shape: CanvasNodeShape,
  w: number,
  h: number,
): HTMLDivElement {
  const fill = NODE_COLORS[DEFAULT_NODE_COLOR_INDEX].fill;
  const stroke = "#3a3a42";
  const sw = 1.5;

  const ghost = document.createElement("div");
  ghost.style.cssText = `
    position: absolute;
    top: -9999px;
    left: -9999px;
    width: ${w}px;
    height: ${h}px;
    opacity: 0.85;
    pointer-events: none;
  `;

  if (shape === "rectangle") {
    ghost.style.cssText += `background: ${fill}; border: ${sw}px solid ${stroke}; border-radius: 12px;`;
  } else if (shape === "pill") {
    ghost.style.cssText += `background: ${fill}; border: ${sw}px solid ${stroke}; border-radius: 9999px;`;
  } else if (shape === "circle") {
    const size = Math.min(w, h);
    ghost.style.width = `${size}px`;
    ghost.style.height = `${size}px`;
    ghost.style.cssText += `background: ${fill}; border: ${sw}px solid ${stroke}; border-radius: 50%;`;
  } else {
    // SVG shapes: diamond, hexagon, cylinder
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", `${w}px`);
    svg.setAttribute("height", `${h}px`);
    svg.setAttribute("viewBox", "0 0 100 100");

    if (shape === "diamond") {
      const poly = document.createElementNS(svgNS, "polygon");
      poly.setAttribute("points", "50,5 95,50 50,95 5,50");
      poly.setAttribute("fill", fill);
      poly.setAttribute("stroke", stroke);
      poly.setAttribute("stroke-width", String(sw));
      poly.setAttribute("stroke-linejoin", "round");
      svg.appendChild(poly);
    } else if (shape === "hexagon") {
      const poly = document.createElementNS(svgNS, "polygon");
      poly.setAttribute(
        "points",
        "50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5",
      );
      poly.setAttribute("fill", fill);
      poly.setAttribute("stroke", stroke);
      poly.setAttribute("stroke-width", String(sw));
      poly.setAttribute("stroke-linejoin", "round");
      svg.appendChild(poly);
    } else if (shape === "cylinder") {
      const topEl = document.createElementNS(svgNS, "ellipse");
      topEl.setAttribute("cx", "50");
      topEl.setAttribute("cy", "22");
      topEl.setAttribute("rx", "38");
      topEl.setAttribute("ry", "12");
      topEl.setAttribute("fill", fill);
      topEl.setAttribute("stroke", stroke);
      topEl.setAttribute("stroke-width", String(sw));
      svg.appendChild(topEl);

      const body = document.createElementNS(svgNS, "path");
      body.setAttribute("d", "M 12,22 L 12,78 A 38,12 0 0,0 88,78 L 88,22 Z");
      body.setAttribute("fill", fill);
      body.setAttribute("stroke", stroke);
      body.setAttribute("stroke-width", String(sw));
      body.setAttribute("stroke-linejoin", "round");
      svg.appendChild(body);
    }

    ghost.appendChild(svg);
  }

  return ghost;
}

// ── Shape panel ────────────────────────────────────────────────────────────

/**
 * Floating pill-shaped toolbar at the bottom-center of the canvas.
 *
 * Provides draggable icon buttons for each supported shape. Users drag
 * a shape onto the canvas to create a new node of that type.
 *
 * While dragging, a ghost preview matching the shape type and default size
 * follows the cursor. The preview is removed automatically on drop or cancel.
 */
export function ShapePanel() {
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLButtonElement>, shape: CanvasNodeShape) => {
      const sizes = SHAPE_DEFAULT_SIZES[shape];
      const payload: ShapeDragData = {
        shape,
        width: sizes.width,
        height: sizes.height,
      };
      e.dataTransfer.setData("application/json", JSON.stringify(payload));
      e.dataTransfer.effectAllowed = "copy";

      // Create a ghost preview element for the drag image
      const ghost = createShapeGhost(shape, sizes.width, sizes.height);
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, sizes.width / 2, sizes.height / 2);
      // The browser captures a snapshot synchronously, so we can remove
      // the element on the next frame.
      requestAnimationFrame(() => {
        if (document.body.contains(ghost)) {
          document.body.removeChild(ghost);
        }
      });
    },
    [],
  );

  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border-default bg-elevated px-3 py-2 shadow-lg">
        {SHAPE_ITEMS.map((item) => (
          <button
            key={item.shape}
            draggable
            onDragStart={(e) => handleDragStart(e, item.shape)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary"
            title={item.label}
            aria-label={`Drag ${item.label} shape`}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

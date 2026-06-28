"use client";

import { useCallback } from "react";
import { useMutation } from "@liveblocks/react";
import { NODE_COLORS } from "@/types/canvas";

// â”€â”€ Props â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ColorToolbarProps {
  nodeId: string;
  currentColor: string;
}

const SWATCH_SIZE = 18;
const SWATCH_GAP = 6;

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Floating color toolbar that appears above selected nodes.
 *
 * Shows one swatch per color pair from NODE_COLORS. Selecting a swatch
 * updates both the node background and text color in the collaborative
 * canvas state. All pointer interactions are stopped from propagating
 * to prevent accidental node dragging or canvas panning.
 */
export function ColorToolbar({ nodeId, currentColor }: ColorToolbarProps) {
  // â”€â”€ Update mutation â”€â”€

  const updateColor = useMutation(
    ({ storage }, id: string, newColor: string) => {
      const flow = storage.get("flow");
      const nodes = flow.get("nodes");
      const node = nodes.get(id);
      if (node) {
        const data = node.get("data");
        // data is a LiveObject u2014 update only the color field directly,
        // preserving all other fields without replacing
        if (typeof data === "object" && data !== null && "set" in data) {
          (data as unknown as { set(key: string, value: unknown): void }).set("color", newColor);
        }
      }
    },
    [],
  );

  const handleClick = useCallback(
    (fill: string) => {
      updateColor(nodeId, fill);
    },
    [nodeId, updateColor],
  );

  // Prevent toolbar interactions from reaching React Flow's drag/pan handlers

  const stopPropagation = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
    },
    [],
  );

  return (
    <div
      className="absolute z-50"
      style={{
        bottom: "calc(100% + 10px)",
        left: "50%",
        transform: "translateX(-50%)",
      }}
      onMouseDown={stopPropagation}
      onMouseMove={stopPropagation}
      onTouchStart={stopPropagation}
    >
      <div
        className="flex items-center rounded-lg"
        style={{
          background: "#18181c",
          border: "1px solid #2a2a30",
          gap: SWATCH_GAP,
          padding: "5px 8px",
        }}
      >
        {NODE_COLORS.map((pair, index) => {
          const isActive = currentColor === pair.fill;

          return (
            <button
              key={index}
              onClick={() => handleClick(pair.fill)}
              className="block cursor-pointer rounded-full transition-all duration-150"
              style={{
                width: SWATCH_SIZE,
                height: SWATCH_SIZE,
                backgroundColor: pair.fill,
                border: isActive
                  ? `2px solid ${pair.text}`
                  : "2px solid transparent",
                outline: isActive ? `1px solid ${pair.text}` : "none",
                outlineOffset: 2,
              }}
              onMouseEnter={(e) => {
                // Subtle glow based on the text color â€” tight blur, not blown out
                e.currentTarget.style.boxShadow = `0 0 5px ${pair.text}77`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
              aria-label={`Color: ${pair.fill}`}
              title={`${pair.fill} / ${pair.text}`}
            />
          );
        })}
      </div>
    </div>
  );
}


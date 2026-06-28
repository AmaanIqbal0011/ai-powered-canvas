"use client";

import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";
import { useTemplateImport } from "@/context/template-import-context";

interface StarterTemplatesModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal that shows available starter system design templates.
 *
 * Each template is rendered as a card with an SVG diagram preview,
 * a name, a description, and an Import button. Clicking Import
 * replaces the current canvas content with the selected template.
 */
export function StarterTemplatesModal({
  open,
  onClose,
}: StarterTemplatesModalProps) {
  const { importTemplate } = useTemplateImport();

  const handleImport = useCallback(
    (template: CanvasTemplate) => {
      if (importTemplate) {
        importTemplate(template);
        onClose();
      }
    },
    [importTemplate, onClose],
  );

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Starter Templates</DialogTitle>
          <DialogDescription>
            Choose a prebuilt system design to get started quickly. Importing a
            template replaces your current canvas.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="flex flex-col gap-5">
            {CANVAS_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onImport={handleImport}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: CanvasTemplate;
  onImport: (template: CanvasTemplate) => void;
}

/**
 * A single template card with a large SVG preview showing the full diagram,
 * name, description, and import button.
 *
 * Layout is horizontal: preview on the left, details on the right.
 */
function TemplateCard({ template, onImport }: TemplateCardProps) {
  return (
    <div className="flex gap-5 rounded-2xl border border-border-default bg-elevated p-5">
      {/* ── Large diagram preview ── */}
      <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-base"
           style={{ width: 420, height: 240 }}>
        <TemplatePreview template={template} />
      </div>

      {/* ── Info + action ── */}
      <div className="flex min-w-0 flex-col justify-between gap-3">
        <div>
          <h3 className="font-semibold text-copy-primary">
            {template.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-copy-muted">
            {template.description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => onImport(template)}>
            Import Template
          </Button>
          <span className="text-xs text-copy-muted">
            {template.nodes.length} nodes &middot; {template.edges.length} edges
          </span>
        </div>
      </div>
    </div>
  );
}

// ── SVG diagram preview ───────────────────────────────────────────────────────

const PREVIEW_W = 420;
const PREVIEW_H = 240;
const PAD = 20;

/**
 * Lightweight SVG preview of a template — no React Flow needed.
 *
 * Calculates the bounding box from the template node positions, scales
 * everything to fit the fixed preview viewport, and draws simplified
 * node shapes and connecting lines.
 */
function TemplatePreview({ template }: { template: CanvasTemplate }) {
  // Calculate bounding box from all node positions and sizes.
  const bounds = template.nodes.map((n) => ({
    x: n.position.x,
    y: n.position.y,
    w: n.width ?? 100,
    h: n.height ?? 80,
  }));

  const minX = Math.min(...bounds.map((b) => b.x));
  const minY = Math.min(...bounds.map((b) => b.y));
  const maxX = Math.max(...bounds.map((b) => b.x + b.w));
  const maxY = Math.max(...bounds.map((b) => b.y + b.h));

  const contentW = maxX - minX || 1;
  const contentH = maxY - minY || 1;

  // Scale to fit the preview viewport, cap at 2× to avoid oversized shapes.
  const scale = Math.min(
    (PREVIEW_W - PAD * 2) / contentW,
    (PREVIEW_H - PAD * 2) / contentH,
    2,
  );

  const offsetX = (PREVIEW_W - contentW * scale) / 2 - minX * scale;
  const offsetY = (PREVIEW_H - contentH * scale) / 2 - minY * scale;

  const tx = (x: number) => x * scale + offsetX;
  const ty = (y: number) => y * scale + offsetY;

  // Build a lookup for quick node access by ID.
  const nodeMap = new Map(template.nodes.map((n) => [n.id, n]));

  return (
    <svg
      width={PREVIEW_W}
      height={PREVIEW_H}
      viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
      className="bg-base"
      aria-hidden
    >
      {/* ── Arrow marker definition (tucked inside defs) ── */}
      <defs>
        <marker
          id="preview-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#555566" />
        </marker>
      </defs>

      {/* ── Edges as lines with arrowheads ── */}
      {template.edges.map((edge) => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return null;

        const x1 = tx(src.position.x + (src.width ?? 100) / 2);
        const y1 = ty(src.position.y + (src.height ?? 80) / 2);
        const x2 = tx(tgt.position.x + (tgt.width ?? 100) / 2);
        const y2 = ty(tgt.position.y + (tgt.height ?? 80) / 2);

        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        return (
          <g key={edge.id}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#555566"
              strokeWidth={1.5}
              markerEnd="url(#preview-arrow)"
            />
            {edge.data?.label && (
              <text
                x={mx} y={my - 4}
                textAnchor="middle"
                fill="#808090"
                fontSize="8"
                fontFamily="Geist Sans, ui-sans-serif, sans-serif"
              >
                {edge.data.label}
              </text>
            )}
          </g>
        );
      })}

      {/* ── Nodes as simplified shapes with labels ── */}
      {template.nodes.map((node) => {
        const x = tx(node.position.x);
        const y = ty(node.position.y);
        const w = (node.width ?? 100) * scale;
        const h = (node.height ?? 80) * scale;
        const fill = node.data.color;

        return (
          <g key={node.id}>
            <ShapePreview
              shape={node.data.shape}
              x={x}
              y={y}
              w={w}
              h={h}
              fill={fill}
            />
            {node.data.label && (
              <text
                x={x + w / 2}
                y={y + h / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#EDEDED"
                fontSize="9"
                fontFamily="Geist Sans, ui-sans-serif, sans-serif"
                className="select-none"
              >
                {node.data.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Individual shape renderers ────────────────────────────────────────────────

interface ShapePreviewProps {
  shape: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
}

/**
 * Render a single shape as an SVG element for the template preview.
 * Mirrors the visual style of the main shape renderer but much simpler.
 */
function ShapePreview({ shape, x, y, w, h, fill }: ShapePreviewProps) {
  const stroke = "#3a3a42";
  const sw = 1;

  switch (shape) {
    case "rectangle":
      return <rect x={x} y={y} width={w} height={h} rx={8} fill={fill} stroke={stroke} strokeWidth={sw} />;

    case "pill":
      return <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth={sw} />;

    case "circle": {
      const r = Math.min(w, h) / 2;
      return <circle cx={x + w / 2} cy={y + h / 2} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />;
    }

    case "diamond": {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = Math.min(w, h) / 2;
      return (
        <polygon
          points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      );
    }

    case "hexagon": {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const hw = w / 2;
      const hh = h / 2;
      return (
        <polygon
          points={`${cx},${cy - hh} ${cx + hw},${cy - hh / 2} ${cx + hw},${cy + hh / 2} ${cx},${cy + hh} ${cx - hw},${cy + hh / 2} ${cx - hw},${cy - hh / 2}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      );
    }

    case "cylinder": {
      const cx = x + w / 2;
      const topY = y + h * 0.15;
      const botY = y + h * 0.85;
      const rx = w / 2;
      const ry = h * 0.12;
      return (
        <g>
          <ellipse cx={cx} cy={botY} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth={sw} />
          <path
            d={`M ${x},${topY} L ${x},${botY} A ${rx},${ry} 0 0,0 ${x + w},${botY} L ${x + w},${topY} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={sw}
          />
          <ellipse cx={cx} cy={topY} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth={sw} />
        </g>
      );
    }

    default:
      return <rect x={x} y={y} width={w} height={h} rx={8} fill={fill} stroke={stroke} strokeWidth={sw} />;
  }
}

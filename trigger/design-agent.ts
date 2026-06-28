import { task } from "@trigger.dev/sdk";
import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { liveblocks } from "@/lib/liveblocks";
import { LiveObject } from "@liveblocks/core";
import { NODE_COLORS, SHAPE_DEFAULT_SIZES } from "@/types/canvas";
import type { CanvasNodeShape } from "@/types/canvas";
import { AI_STATUS_FEED_ID, type AiStatusFeedMessage } from "@/types/tasks";

// ── Zod schema for the generated design output ──────────────────────────────

const AddNodeAction = z.object({
  action: z.literal("add_node"),
  id: z
    .string()
    .describe("Unique lowercase-hyphenated ID, e.g. 'api-gateway', 'user-db'"),
  label: z
    .string()
    .min(1)
    .max(50)
    .describe("Short display label (1–4 words)"),
  shape: z.enum([
    "rectangle",
    "diamond",
    "circle",
    "pill",
    "cylinder",
    "hexagon",
  ] as const),
  colorIndex: z
    .number()
    .int()
    .min(0)
    .max(7)
    .describe(
      "Color palette index: 0=neutral, 1=blue, 2=purple, 3=orange, 4=red, 5=pink, 6=green, 7=teal"
    ),
  x: z.number().describe("X position in canvas coordinates"),
  y: z.number().describe("Y position in canvas coordinates"),
  width: z.number().optional().describe("Width in pixels (uses shape default if omitted)"),
  height: z.number().optional().describe("Height in pixels (uses shape default if omitted)"),
});

const MoveNodeAction = z.object({
  action: z.literal("move_node"),
  id: z.string().describe("ID of the node to move"),
  x: z.number().describe("New X position"),
  y: z.number().describe("New Y position"),
});

const ResizeNodeAction = z.object({
  action: z.literal("resize_node"),
  id: z.string().describe("ID of the node to resize"),
  width: z.number().min(80).describe("New width in pixels"),
  height: z.number().min(60).describe("New height in pixels"),
});

const UpdateNodeDataAction = z.object({
  action: z.literal("update_node_data"),
  id: z.string().describe("ID of the node to update"),
  label: z.string().min(1).max(50).optional().describe("New label"),
  colorIndex: z
    .number()
    .int()
    .min(0)
    .max(7)
    .optional()
    .describe("New color index"),
});

const DeleteNodeAction = z.object({
  action: z.literal("delete_node"),
  id: z.string().describe("ID of the node to delete"),
});

const AddEdgeAction = z.object({
  action: z.literal("add_edge"),
  id: z.string().describe("Unique edge ID"),
  source: z.string().describe("Source node ID"),
  target: z.string().describe("Target node ID"),
  label: z.string().optional().describe("Optional edge label"),
});

const DeleteEdgeAction = z.object({
  action: z.literal("delete_edge"),
  id: z.string().describe("ID of the edge to delete"),
});

const DesignSchema = z.object({
  actions: z
    .array(
      z.discriminatedUnion("action", [
        AddNodeAction,
        MoveNodeAction,
        ResizeNodeAction,
        UpdateNodeDataAction,
        DeleteNodeAction,
        AddEdgeAction,
        DeleteEdgeAction,
      ])
    )
    .min(1)
    .max(40)
    .describe(
      "Ordered list of canvas actions. Processed sequentially — adds before moves/resizes, deletes last."
    ),
});

// ── AI presence & broadcast helpers ─────────────────────────────────────────

const AI_USER_ID = "ai-ghost";
const AI_USER_INFO = {
  name: "Ghost AI",
  avatar: "",
  color: "#6457f9",
};

async function setAiPresence(
  roomId: string,
  isThinking: boolean,
  cursor?: { x: number; y: number } | null
) {
  try {
    await liveblocks.setPresence(roomId, {
      userId: AI_USER_ID,
      data: { cursor: cursor ?? null, isThinking },
      userInfo: AI_USER_INFO,
      ttl: isThinking ? 300 : 10,
    });
  } catch (err) {
    console.warn("[design-agent] setPresence failed:", err);
  }
}

async function broadcastStatus(roomId: string, message: string) {
  try {
    await liveblocks.broadcastEvent(roomId, {
      type: "ai-status",
      message,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[design-agent] broadcastEvent failed:", err);
  }
}

async function postToAiFeed(
  roomId: string,
  data: AiStatusFeedMessage
) {
  try {
    await liveblocks.createFeedMessage({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      data,
    });
  } catch (err) {
    console.warn("[design-agent] createFeedMessage failed:", err);
  }
}

// ── Color index → hex mapping helper ────────────────────────────────────────

const COLOR_INDEX_MAP = [
  "#1F1F1F", // 0 neutral
  "#10233D", // 1 blue
  "#2E1938", // 2 purple
  "#331B00", // 3 orange
  "#3C1618", // 4 red
  "#3A1726", // 5 pink
  "#0F2E18", // 6 green
  "#062822", // 7 teal
];

function fillColorForIndex(index: number): string {
  return COLOR_INDEX_MAP[index] ?? COLOR_INDEX_MAP[0];
}

function colorForIndex(colorIndex: number): string {
  if (colorIndex >= 0 && colorIndex < NODE_COLORS.length) {
    return NODE_COLORS[colorIndex].fill;
  }
  return fillColorForIndex(colorIndex);
}

// ── Task ────────────────────────────────────────────────────────────────────

/**
 * AI Design Agent Task
 *
 * Takes a natural-language prompt, reads the current canvas state from the
 * Liveblocks room, uses Gemini to generate a system architecture, and writes
 * the resulting actions into the shared room storage.
 *
 * Supported actions:
 *   - add_node / move_node / resize_node / update_node_data / delete_node
 *   - add_edge / delete_edge
 *
 * During execution it:
 *   - Sets AI presence (cursor + thinking state) so others see the AI at work.
 *   - Broadcasts status messages so the UI can show real-time progress.
 *   - Cleans up presence and broadcasts errors on failure.
 *
 * Triggered from POST /api/ai/design.
 */
export const designAgent = task({
  id: "design-agent",
  run: async (payload: {
    prompt: string;
    roomId: string;
    projectId?: string;
  }) => {
    const { prompt, roomId } = payload;

    console.log(
      `[design-agent] Generating design for room ${roomId}: "${prompt}"`
    );

    await setAiPresence(roomId, true);
    await broadcastStatus(
      roomId,
      "🧠 AI Architect is analyzing your request…"
    );
    await postToAiFeed(roomId, {
      text: "AI Architect is analyzing your request…",
      phase: "analyzing",
    });

    try {
      // ── 1. Read current canvas state ────────────────────────────────
      const storageDoc = await liveblocks.getStorageDocument(roomId, "json");
      const flow = (storageDoc as Record<string, unknown>)?.flow as
        | Record<string, unknown>
        | undefined;
      const existingNodesObj = flow?.nodes as
        | Record<string, unknown>
        | undefined;
      const existingEdgesObj = flow?.edges as
        | Record<string, unknown>
        | undefined;
      const existingNodeCount = existingNodesObj
        ? Object.keys(existingNodesObj).length
        : 0;
      const existingEdgeCount = existingEdgesObj
        ? Object.keys(existingEdgesObj).length
        : 0;

      // Build a summary of existing nodes for the AI prompt.
      const existingNodeSummary = existingNodesObj
        ? Object.entries(existingNodesObj).map(([id, node]) => {
            const n = node as Record<string, unknown>;
            const data = n.data as Record<string, unknown> | undefined;
            const pos = n.position as Record<string, unknown> | undefined;
            return {
              id,
              label: data?.label ?? "",
              shape: data?.shape ?? "rectangle",
              x: pos?.x ?? 0,
              y: pos?.y ?? 0,
            };
          })
        : [];

      console.log(
        `[design-agent] Canvas has ${existingNodeCount} nodes, ${existingEdgeCount} edges`
      );

      await broadcastStatus(
        roomId,
        "🎨 Generating system design with AI…"
      );
      await postToAiFeed(roomId, {
        text: "Generating system design with AI…",
        phase: "generating",
      });

      // ── 2. Generate design with Gemini ─────────────────────────────
      const { output: design } = await generateText({
        model: google("gemini-2.5-flash"),
        output: Output.object({ schema: DesignSchema }),
        system: [
          "You are a system architecture designer. Generate canvas actions to create or modify a system design based on the user's prompt.",
          "",
          "## Available Actions",
          "- add_node: Create a new node with id, label, shape, colorIndex, x, y, optional width/height",
          "- move_node: Reposition an existing node by id to new x, y coordinates",
          "- resize_node: Change an existing node's width and height (min 80×60)",
          "- update_node_data: Change an existing node's label or colorIndex",
          "- delete_node: Remove a node by id",
          "- add_edge: Create an edge between two existing nodes, with optional label",
          "- delete_edge: Remove an edge by id",
          "",
          "## Shape Rules",
          "- rectangle → general service / component",
          "- diamond → decision / gateway / router",
          "- circle → event / endpoint",
          "- pill → service / process",
          "- cylinder → database / storage / cache",
          "- hexagon → external system / boundary / integration",
          "",
          "## Color Rules (index 0–7)",
          "- 0 (neutral) → default / general",
          "- 1 (blue) → API / app logic",
          "- 2 (purple) → external / third-party",
          "- 3 (orange) → events / messaging",
          "- 4 (red) → critical / auth / errors",
          "- 5 (pink) → UI / frontend",
          "- 6 (green) → data / storage",
          "- 7 (teal) → infrastructure / networking",
          "",
          "## Layout Rules",
          "- Arrange nodes left-to-right in a readable flow",
          "- Horizontal spacing: 250–350 px",
          "- Vertical spacing: 180–250 px",
          "- Start x positions around 100 and increase by ~300 per layer",
          "- Layer 1 (left): clients / entry points",
          "- Layer 2 (middle): application / business logic",
          "- Layer 3 (right): data / external services",
          "",
          "## Naming",
          "- Use lowercase-hyphenated IDs (e.g. 'api-gateway', 'user-db')",
          "- Keep labels concise: 1–4 words",
          "- Connect related nodes with descriptive edge labels",
          "",
          "## Ordering",
          "- Process actions in the order given",
          "- Perform add actions before move/resize/update",
          "- Perform delete actions last",
        ].join("\n"),
        prompt: [
          `Design a system architecture for: ${prompt}`,
          existingNodeCount > 0
            ? `The canvas already has ${existingNodeCount} node(s) and ${existingEdgeCount} edge(s). You can add new nodes/edges, move/resize/update existing nodes, or delete nodes/edges as needed to create or modify the design.`
            : null,
          existingNodeSummary.length > 0
            ? `Existing nodes: ${JSON.stringify(existingNodeSummary)}`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
      });

      if (!design || !design.actions || design.actions.length === 0) {
        throw new Error("AI returned an empty design — no actions generated");
      }

      // Count action types for status messages.
      const actionCounts = design.actions.reduce(
        (acc, a) => {
          acc[a.action] = (acc[a.action] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const parts: string[] = [];
      if (actionCounts.add_node) parts.push(`${actionCounts.add_node} node(s)`);
      if (actionCounts.add_edge) parts.push(`${actionCounts.add_edge} edge(s)`);
      if (actionCounts.move_node) parts.push(`${actionCounts.move_node} move(s)`);
      if (actionCounts.resize_node) parts.push(`${actionCounts.resize_node} resize(s)`);
      if (actionCounts.update_node_data) parts.push(`${actionCounts.update_node_data} update(s)`);
      if (actionCounts.delete_node) parts.push(`${actionCounts.delete_node} node deletion(s)`);
      if (actionCounts.delete_edge) parts.push(`${actionCounts.delete_edge} edge deletion(s)`);

      console.log(
        `[design-agent] Gemini returned ${design.actions.length} actions: ${parts.join(", ")}`
      );

      await broadcastStatus(
        roomId,
        `📐 Applying ${design.actions.length} change(s) to canvas…`
      );
      await postToAiFeed(roomId, {
        text: `Applying ${design.actions.length} change(s) to canvas…`,
        phase: "placing",
      });

      // ── 3. Apply actions into Liveblocks room storage ──────────────
      await liveblocks.mutateStorage(roomId, ({ root }) => {
        const flowObj = root.get("flow") as
          | { get: (key: string) => unknown }
          | undefined;

        if (!flowObj) {
          throw new Error(
            "Room storage has no 'flow' object. Is the canvas initialised?"
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nodesMap = flowObj.get("nodes") as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const edgesMap = flowObj.get("edges") as any;

        for (const action of design.actions) {
          switch (action.action) {
            case "add_node": {
              const shape = action.shape as CanvasNodeShape;
              const defaultSize =
                SHAPE_DEFAULT_SIZES[shape] ?? SHAPE_DEFAULT_SIZES.rectangle;

              nodesMap.set(
                action.id,
                new LiveObject({
                  id: action.id,
                  type: "canvasNode",
                  position: { x: action.x, y: action.y },
                  width: action.width ?? defaultSize.width,
                  height: action.height ?? defaultSize.height,
                  data: {
                    label: action.label,
                    color: colorForIndex(action.colorIndex),
                    shape: action.shape,
                  },
                })
              );
              break;
            }

            case "move_node": {
              const node = nodesMap.get(action.id);
              if (node) {
                node.set("position", { x: action.x, y: action.y });
              }
              break;
            }

            case "resize_node": {
              const node = nodesMap.get(action.id);
              if (node) {
                node.set("width", action.width);
                node.set("height", action.height);
              }
              break;
            }

            case "update_node_data": {
              const node = nodesMap.get(action.id);
              if (node) {
                const data = node.get("data") as
                  | { get: (k: string) => unknown; set: (k: string, v: unknown) => void }
                  | undefined;
                if (data) {
                  if (action.label !== undefined) {
                    data.set("label", action.label);
                  }
                  if (action.colorIndex !== undefined) {
                    data.set("color", colorForIndex(action.colorIndex));
                  }
                }
              }
              break;
            }

            case "delete_node": {
              nodesMap.delete(action.id);
              break;
            }

            case "add_edge": {
              edgesMap.set(
                action.id,
                new LiveObject({
                  id: action.id,
                  source: action.source,
                  target: action.target,
                  type: "canvasEdge",
                  data: { label: action.label ?? "" },
                })
              );
              break;
            }

            case "delete_edge": {
              edgesMap.delete(action.id);
              break;
            }
          }
        }
      });

      // ── 4. Broadcast success ───────────────────────────────────────
      const addedNodes = actionCounts.add_node ?? 0;
      const addedEdges = actionCounts.add_edge ?? 0;
      const totalChanges = design.actions.length;

      await broadcastStatus(
        roomId,
        `✅ Design complete - ${totalChanges} change(s) applied (${parts.join(", ")})`
      );
      await postToAiFeed(roomId, {
        text: `Design complete - ${totalChanges} change(s) applied`,
        phase: "complete",
      });

      return {
        prompt,
        roomId,
        timestamp: new Date().toISOString(),
        actions: design.actions.length,
        summary: parts.join(", "),
      };
    } catch (error) {
      // ── Error handling ─────────────────────────────────────────────
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[design-agent] Failed: ${errorMessage}`);

      await broadcastStatus(
        roomId,
        `❌ Design generation failed: ${
          errorMessage.length > 120
            ? errorMessage.slice(0, 120) + "…"
            : errorMessage
        }`
      );
      await postToAiFeed(roomId, {
        text: `Design generation failed: ${
          errorMessage.length > 120
            ? errorMessage.slice(0, 120) + "…"
            : errorMessage
        }`,
        phase: "failed",
      });

      // Preserve the original error for Trigger.dev retry logic.
      throw error;
    } finally {
      // ── Clean up AI presence ───────────────────────────────────────
      await setAiPresence(roomId, false);
    }
  },
});

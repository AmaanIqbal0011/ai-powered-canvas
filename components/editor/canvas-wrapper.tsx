"use client";

import { Component, useCallback, useEffect, useRef, type PropsWithChildren } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  type Connection,
} from "@xyflow/react";
import {
  useLiveblocksFlow,
} from "@liveblocks/react-flow";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useUndo,
  useRedo,
  useUpdateMyPresence,
} from "@liveblocks/react";
import { LiveObject, LiveMap } from "@liveblocks/client";

import type {
  CanvasNode,
  CanvasEdge,
  ShapeDragData,
} from "@/types/canvas";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import {
  CANVAS_NODE_TYPE,
  CANVAS_EDGE_TYPE,
  NODE_COLORS,
  DEFAULT_NODE_COLOR_INDEX,
} from "@/types/canvas";
import CanvasNodeComponent from "@/components/editor/canvas-node";
import CanvasEdgeComponent from "@/components/editor/canvas-edge";
import { ShapePanel } from "@/components/editor/shape-panel";
import { CanvasControlBar } from "@/components/editor/canvas-control-bar";
import { PresenceAvatars } from "@/components/editor/presence-avatars";
import { CanvasCursors } from "@/components/editor/canvas-cursor";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAutosave } from "@/hooks/use-autosave";
import { useSaveStatus } from "@/context/save-status-context";
import { useTemplateImport } from "@/context/template-import-context";
import { ChatFeedProvider } from "@/context/chat-feed-context";
import { useAiSidebarState } from "@/context/ai-sidebar-state-context";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import "@xyflow/react/dist/style.css";

// ── Node ID generator ──────────────────────────────────────────────────────

let nodeCounter = 0;

/**
 * Generate a unique node ID using the shape name, timestamp, and counter.
 */
function generateNodeId(shape: string): string {
  nodeCounter += 1;
  return `${shape}-${Date.now()}-${nodeCounter}`;
}

// ── Registered node types ──────────────────────────────────────────────────

const nodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeComponent,
};

// ── Registered edge types ──────────────────────────────────────────────────

const edgeTypes = {
  [CANVAS_EDGE_TYPE]: CanvasEdgeComponent,
};

// ── Error boundary ─────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Simple error boundary that catches rendering errors in its subtree.
 */
class CanvasErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ── Loading and error states ────────────────────────────────────────────────

/**
 * Loading state for the canvas — shown while Liveblocks Storage loads.
 */
function CanvasLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-sm text-copy-muted">Connecting to canvas…</p>
      </div>
    </div>
  );
}

/**
 * Error fallback for Liveblocks connection issues.
 */
function CanvasErrorFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base px-4">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-subtle">
          <span className="text-lg text-error">!</span>
        </div>
        <p className="text-sm font-medium text-copy-primary">
          Could not connect to the canvas
        </p>
        <p className="text-xs text-copy-muted">
          An unexpected error occurred. Try refreshing the page.
        </p>
      </div>
    </div>
  );
}

// ── Room provider ───────────────────────────────────────────────────────────

/** Props for the Liveblocks room provider wrapping the canvas. */
interface CanvasRoomProps {
  roomId: string;
}

/**
 * Renders the AI sidebar inside RoomProvider scope so it can access
 * Liveblocks feed hooks via ChatFeedProvider.
 */
function AiSidebarInRoom({ roomId }: { roomId: string }) {
  const { isOpen, close } = useAiSidebarState();
  return (
    <AiSidebar
      isOpen={isOpen}
      onClose={close}
      roomId={roomId}
      projectId={roomId}
    />
  );
}

/**
 * Room provider wrapper — sets up the Liveblocks room for the canvas.
 *
 * Uses the project room ID and provides the initial presence shape
 * expected by the Liveblocks types.
 */
function CanvasRoom({ roomId, children }: PropsWithChildren<CanvasRoomProps>) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, isThinking: false }}
        initialStorage={{
          flow: new LiveObject({ nodes: new LiveMap(), edges: new LiveMap() }),
        }}
      >
        <ChatFeedProvider>
          <AiSidebarInRoom roomId={roomId} />
          <CanvasErrorBoundary fallback={<CanvasErrorFallback />}>
            <ClientSideSuspense fallback={<CanvasLoading />}>
              {children}
            </ClientSideSuspense>
          </CanvasErrorBoundary>
        </ChatFeedProvider>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

// ── Canvas flow (inner, within ReactFlowProvider) ──────────────────────────

/** Number of milliseconds to debounce canvas saves after the last change. */
const AUTOSAVE_DEBOUNCE_MS = 2000;

/**
 * Inner canvas flow — rendered inside both the Liveblocks room
 * and a ReactFlowProvider so `useReactFlow` hooks are available.
 */
function CanvasFlow({ roomId }: { roomId: string }) {
  const reactFlowInstance = useReactFlow();

  const undo = useUndo();
  const redo = useRedo();
  const updateMyPresence = useUpdateMyPresence();
  const cursorRafRef = useRef(0);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    nodes: {
      initial: [],
    },
    edges: {
      initial: [],
    },
    suspense: true,
  });

  // Wire keyboard shortcuts
  useKeyboardShortcuts(reactFlowInstance, undo, redo, onNodesChange, onEdgesChange);

  // ── Mutation: add a node via useLiveblocksFlow internal handler ──
  // Using onNodesChange with an "add" change ensures the node is stored as a
  // properly configured LiveObject (via LiveObject.from with sync config),
  // which is required for internal methods like setLocal() during drag.
  const addNode = useCallback(
    (node: CanvasNode) => {
      onNodesChange([{ type: "add" as const, item: node }]);
    },
    [onNodesChange],
  );

  // ── Drop handler ──
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  // ── Cursor broadcasting ────────────────────────────────────────────────
  // Broadcast cursor position on mouse move (throttled via requestAnimationFrame)
  // and clear cursor to null when the mouse leaves the canvas.

  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const x = event.clientX;
      const y = event.clientY;
      cancelAnimationFrame(cursorRafRef.current);
      cursorRafRef.current = requestAnimationFrame(() => {
        const position = reactFlowInstance.screenToFlowPosition({ x, y });
        updateMyPresence({ cursor: position });
      });
    },
    [reactFlowInstance, updateMyPresence],
  );

  const onMouseLeave = useCallback(() => {
    cancelAnimationFrame(cursorRafRef.current);
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  // Broadcast cursor position during node drag (React Flow's internal
  // drag handling may prevent the wrapper mouse events from firing).
  const onNodeDrag = useCallback(
    (event: globalThis.MouseEvent | globalThis.TouchEvent) => {
      // Only process mouse events for cursor position.
      if ("clientX" in event) {
        const x = event.clientX;
        const y = event.clientY;
        cancelAnimationFrame(cursorRafRef.current);
        cursorRafRef.current = requestAnimationFrame(() => {
          const position = reactFlowInstance.screenToFlowPosition({ x, y });
          updateMyPresence({ cursor: position });
        });
      }
    },
    [reactFlowInstance, updateMyPresence],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // Read the shape drag payload
      const rawData = event.dataTransfer.getData("application/json");
      if (!rawData) return;

      let payload: ShapeDragData;
      try {
        payload = JSON.parse(rawData);
      } catch {
        return;
      }

      if (!payload.shape) return;

      // Convert screen position to canvas coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Offset so the node center appears at the exact cursor position
      // (screenToFlowPosition accounts for pan and zoom, but places the
      // node's top-left corner at the cursor without this offset)
      const centeredPosition = {
        x: position.x - (payload.width ?? 0) / 2,
        y: position.y - (payload.height ?? 0) / 2,
      };

      // Create the new node and add it to Liveblocks storage
      const id = generateNodeId(payload.shape);
      const newNode: CanvasNode = {
        id,
        type: CANVAS_NODE_TYPE,
        position: centeredPosition,
        width: payload.width,
        height: payload.height,
        data: {
          label: "",
          color: NODE_COLORS[DEFAULT_NODE_COLOR_INDEX].fill,
          shape: payload.shape,
        },
      };

      addNode(newNode);
    },
    [reactFlowInstance, addNode],
  );

  // ── Edge options ──
  const defaultEdgeOptions = {
    type: CANVAS_EDGE_TYPE,
    data: { label: "" } satisfies CanvasEdge["data"],
    style: { stroke: "#3a3a42", strokeWidth: 1.5 },
    markerEnd: { type: "arrowclosed", color: "#3a3a42" } as const,
  };

  const onConnectHandler = useCallback(
    (connection: Connection) => {
      // Pass the connection directly — defaultEdgeOptions on ReactFlow
      // handles setting the edge type, data, and style for new edges.
      // The edge is stored in Liveblocks Storage via useLiveblocksFlow,
      // which calls onNodesChange/onEdgesChange internally.
      onConnect(connection);
    },
    [onConnect],
  );

  // ── Template import ──────────────────────────────────────────────────
  const { registerHandler } = useTemplateImport();

  const importTemplate = useCallback(
    (template: CanvasTemplate) => {
      const prefix = `${template.id}-${Date.now()}`;
      const idMap = new Map<string, string>();

      // Assign unique IDs to each template node to avoid collisions.
      const newNodes: CanvasNode[] = template.nodes.map((n) => {
        const newId = `${prefix}-${n.id}`;
        idMap.set(n.id, newId);
        return { ...n, id: newId };
      });

      // Remap edge source/target IDs to the new unique node IDs.
      const newEdges: CanvasEdge[] = template.edges.map((e) => ({
        ...e,
        id: `${prefix}-${e.id}`,
        source: idMap.get(e.source) ?? e.source,
        target: idMap.get(e.target) ?? e.target,
      }));

      // Remove all existing nodes and edges.
      onNodesChange(
        nodes.map((n) => ({ type: "remove" as const, id: n.id })),
      );
      onEdgesChange(
        edges.map((e) => ({ type: "remove" as const, id: e.id })),
      );

      // Add the template nodes and edges.
      onNodesChange(
        newNodes.map((n) => ({ type: "add" as const, item: n })),
      );
      onEdgesChange(
        newEdges.map((e) => ({ type: "add" as const, item: e })),
      );

      // Fit the view after the new nodes render.
      requestAnimationFrame(() => {
        reactFlowInstance.fitView({ duration: 200 });
      });
    },
    [nodes, edges, onNodesChange, onEdgesChange, reactFlowInstance],
  );

  // Register the import handler so the starter templates modal can trigger it.
  useEffect(() => {
    registerHandler(importTemplate);
  }, [importTemplate, registerHandler]);

  // ── Autosave ────────────────────────────────────────────
  // Debounce-save the canvas state whenever nodes or edges change.
  // Exposes a save() function for manual save from the navbar.
  const { save } = useAutosave(roomId, nodes, edges);
  const { registerSaveHandler } = useSaveStatus();

  useEffect(() => {
    registerSaveHandler(save);
  }, [save, registerSaveHandler]);

  // ── Load saved canvas on mount ──────────────────────────
  // If the Liveblocks room is empty (no existing nodes or edges), fetch the
  // last saved canvas state from Vercel Blob and populate the room.
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;

    // Room already has active content — skip loading to avoid overwriting
    // active collaboration.
    if (nodes.length > 0 || edges.length > 0) {
      hasLoadedRef.current = true;
      return;
    }

    hasLoadedRef.current = true;

    fetch(`/api/projects/${roomId}/canvas`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<{ nodes: CanvasNode[]; edges: CanvasEdge[] }>;
      })
      .then((data) => {
        if (!data) return;
        if (data.nodes?.length > 0) {
          onNodesChange(
            data.nodes.map((n) => ({ type: "add" as const, item: n })),
          );
        }
        if (data.edges?.length > 0) {
          onEdgesChange(
            data.edges.map((e) => ({ type: "add" as const, item: e })),
          );
        }
        // Fit the view once the restored nodes are rendered.
        if ((data.nodes?.length ?? 0) > 0 || (data.edges?.length ?? 0) > 0) {
          requestAnimationFrame(() => {
            reactFlowInstance.fitView({ duration: 200 });
          });
        }
      })
      .catch(() => {
        // Silently fail — no saved canvas to load, or the request failed.
      });
    // Only run once when the room first connects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative flex h-full w-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <ReactFlow<CanvasNode, CanvasEdge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnectHandler}
        onDelete={onDelete}
        onNodeDrag={onNodeDrag}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineStyle={{ stroke: "#f8fafc", strokeWidth: 1.5 }}
        colorMode="dark"
        panOnScroll
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
      >
        <CanvasCursors />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#3a3a42"
        />
        <MiniMap
          style={{ background: "#111114" }}
          nodeColor="#1e1e23"
          maskColor="rgba(0, 0, 0, 0.6)"
          pannable
          zoomable
        />
        <CanvasControlBar />
        <ShapePanel />
      </ReactFlow>

      <PresenceAvatars />
    </div>
  );
}

// ── Canvas content ─────────────────────────────────────────────────────────

/**
 * Canvas content — wraps the flow in a ReactFlowProvider so that
 * `useReactFlow` hooks are available for the drop handler.
 */
function CanvasContent({ roomId }: { roomId: string }) {
  return (
    <ReactFlowProvider>
      <CanvasFlow roomId={roomId} />
    </ReactFlowProvider>
  );
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Canvas wrapper — entry point for the collaborative canvas.
 *
 * Sets up the Liveblocks room, handles loading and error states,
 * and renders the React Flow canvas backed by Liveblocks Storage
 * with the shape panel for creating new nodes.
 */
export function CanvasWrapper({ roomId }: CanvasRoomProps) {
  return (
    <CanvasRoom roomId={roomId}>
      <CanvasContent roomId={roomId} />
    </CanvasRoom>
  );
}

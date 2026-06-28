import type { CanvasNode, CanvasEdge, CanvasNodeShape } from "@/types/canvas";
import {
  CANVAS_NODE_TYPE,
  CANVAS_EDGE_TYPE,
  SHAPE_DEFAULT_SIZES,
} from "@/types/canvas";

/**
 * A prebuilt system design template that can be imported into the canvas.
 */
export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// ── Helper factories ─────────────────────────────────────────────────────────

/**
 * Create a canvas node with default sizing for its shape.
 */
function makeNode(
  id: string,
  label: string,
  shape: CanvasNodeShape,
  color: string,
  x: number,
  y: number,
): CanvasNode {
  const size = SHAPE_DEFAULT_SIZES[shape];
  return {
    id,
    type: CANVAS_NODE_TYPE,
    position: { x, y },
    width: size.width,
    height: size.height,
    data: { label, color, shape },
  };
}

/**
 * Create a canvas edge.
 */
function makeEdge(
  id: string,
  source: string,
  target: string,
  label?: string,
): CanvasEdge {
  return {
    id,
    source,
    target,
    type: CANVAS_EDGE_TYPE,
    data: { label: label ?? "" },
  };
}

// ── Templates ────────────────────────────────────────────────────────────────

/**
 * Curated library of prebuilt system design templates.
 *
 * Each template is a static snapshot of nodes and edges that follows the
 * shared canvas schema so it can be loaded directly into the Liveblocks room.
 */
export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description:
      "A typical microservices architecture with an API gateway, dedicated services, and a shared database.",
    nodes: [
      makeNode("ms-gateway", "API Gateway", "rectangle", "#1F1F1F", 170, 10),
      makeNode("ms-auth", "Auth Service", "pill", "#10233D", 20, 130),
      makeNode("ms-users", "User Service", "pill", "#2E1938", 170, 130),
      makeNode("ms-orders", "Order Service", "pill", "#331B00", 320, 130),
      makeNode("ms-payment", "Payment Service", "pill", "#3A1726", 470, 130),
      makeNode("ms-db", "Database", "cylinder", "#3C1618", 320, 250),
    ],
    edges: [
      makeEdge("ms-e1", "ms-gateway", "ms-auth", "Authenticate"),
      makeEdge("ms-e2", "ms-gateway", "ms-users", "Manage"),
      makeEdge("ms-e3", "ms-gateway", "ms-orders", "Process"),
      makeEdge("ms-e4", "ms-orders", "ms-payment", "Charge"),
      makeEdge("ms-e5", "ms-orders", "ms-db", "Store"),
    ],
  },
  {
    id: "cicd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "A continuous integration and deployment pipeline from code push through build, test, review, and production.",
    nodes: [
      makeNode("ci-commit", "Code Push", "circle", "#0F2E18", 20, 80),
      makeNode("ci-build", "Build", "rectangle", "#1F1F1F", 150, 70),
      makeNode("ci-test", "Test", "rectangle", "#2E1938", 320, 70),
      makeNode("ci-staging", "Deploy Staging", "pill", "#331B00", 490, 70),
      makeNode("ci-qa", "QA Review", "diamond", "#10233D", 490, 210),
      makeNode("ci-prod", "Deploy Production", "pill", "#0F2E18", 490, 390),
    ],
    edges: [
      makeEdge("ci-e1", "ci-commit", "ci-build"),
      makeEdge("ci-e2", "ci-build", "ci-test"),
      makeEdge("ci-e3", "ci-test", "ci-staging"),
      makeEdge("ci-e4", "ci-staging", "ci-qa", "Approve"),
      makeEdge("ci-e5", "ci-qa", "ci-prod"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description:
      "An event-driven architecture with a producer, a central event bus, and multiple consumer services.",
    nodes: [
      makeNode("ed-producer", "Event Producer", "circle", "#062822", 20, 120),
      makeNode("ed-bus", "Event Bus", "hexagon", "#1F1F1F", 190, 110),
      makeNode("ed-svc-a", "Service A", "pill", "#10233D", 400, 30),
      makeNode("ed-svc-b", "Service B", "pill", "#331B00", 400, 140),
      makeNode("ed-svc-c", "Service C", "pill", "#2E1938", 400, 250),
      makeNode("ed-db", "Database", "cylinder", "#3C1618", 400, 370),
    ],
    edges: [
      makeEdge("ed-e1", "ed-producer", "ed-bus", "Publish"),
      makeEdge("ed-e2", "ed-bus", "ed-svc-a", "Subscribe"),
      makeEdge("ed-e3", "ed-bus", "ed-svc-b", "Subscribe"),
      makeEdge("ed-e4", "ed-bus", "ed-svc-c", "Subscribe"),
      makeEdge("ed-e5", "ed-svc-c", "ed-db", "Write"),
    ],
  },
];

import { task } from "@trigger.dev/sdk";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { liveblocks } from "@/lib/liveblocks";
import { AI_STATUS_FEED_ID, type AiStatusFeedMessage } from "@/types/tasks";

// ── Zod schema for task input ───────────────────────────────────────────────

const ChatMessageSchema = z.object({
  sender: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number(),
});

const GenerateSpecSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(ChatMessageSchema),
  nodes: z.array(z.record(z.string(), z.unknown())),
  edges: z.array(z.record(z.string(), z.unknown())),
});

// ── AI presence & feed helpers ──────────────────────────────────────────────

const AI_USER_ID = "ai-ghost";
const AI_USER_INFO = {
  name: "Ghost AI",
  avatar: "",
  color: "#6457f9",
};

async function setAiPresence(roomId: string, isThinking: boolean) {
  try {
    await liveblocks.setPresence(roomId, {
      userId: AI_USER_ID,
      data: { cursor: null, isThinking },
      userInfo: AI_USER_INFO,
      ttl: isThinking ? 300 : 10,
    });
  } catch (err) {
    console.warn("[generate-spec] setPresence failed:", err);
  }
}

async function postToAiFeed(roomId: string, data: AiStatusFeedMessage) {
  try {
    await liveblocks.createFeedMessage({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      data,
    });
  } catch (err) {
    console.warn("[generate-spec] createFeedMessage failed:", err);
  }
}

// ── Task ────────────────────────────────────────────────────────────────────

/**
 * AI Spec Generation Task
 *
 * Reads the current canvas graph (nodes and edges) and chat history,
 * uses Gemini to generate a Markdown technical specification, and
 * returns the spec content as task output.
 *
 * Triggered from POST /api/ai/spec.
 */
export const generateSpec = task({
  id: "generate-spec",
  run: async (payload: {
    projectId: string;
    roomId: string;
    chatHistory: Array<{
      sender: string;
      role: "user" | "assistant";
      content: string;
      timestamp: number;
    }>;
    nodes: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
  }) => {
    const parsed = GenerateSpecSchema.parse(payload);
    const { projectId, roomId, chatHistory, nodes, edges } = parsed;

    console.log(
      `[generate-spec] Generating spec for project ${projectId} in room ${roomId}`
    );

    await setAiPresence(roomId, true);
    await postToAiFeed(roomId, {
      text: "Analyzing canvas and chat history…",
      phase: "analyzing",
    });

    try {
      // ── 1. Format canvas context for the AI prompt ─────────────────
      const nodeSummary = nodes.map((n) => {
        const data = n.data as Record<string, unknown> | undefined;
        const pos = n.position as Record<string, unknown> | undefined;
        return {
          id: n.id,
          label: data?.label ?? "",
          shape: data?.shape ?? "rectangle",
          color: data?.color ?? "",
          x: pos?.x ?? 0,
          y: pos?.y ?? 0,
        };
      });

      const edgeSummary = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: (e.data as Record<string, unknown>)?.label ?? "",
      }));

      const chatContext = chatHistory
        .filter((m) => m.content.trim().length > 0)
        .map((m) => `[${m.role === "user" ? "User" : "AI"}] ${m.content}`)
        .join("\n");

      console.log(
        `[generate-spec] Canvas: ${nodeSummary.length} nodes, ${edgeSummary.length} edges, ${chatHistory.length} chat messages`
      );

      await postToAiFeed(roomId, {
        text: "Generating technical specification…",
        phase: "generating",
      });

      // ── 2. Generate Markdown spec with Gemini ──────────────────────
      const { text: specContent } = await generateText({
        model: google("gemini-2.5-flash"),
        system: [
          "You are a senior software architect writing a technical specification.",
          "Given a system design diagram (nodes and edges) and conversation context,",
          "produce a comprehensive Markdown technical specification document.",
          "",
          "## Document Structure",
          "Write the spec with these sections in order:",
          "",
          "### 1. Overview",
          "A high-level summary of the system being designed.",
          "",
          "### 2. System Components",
          "For each node in the diagram, describe:",
          "- Component name and purpose",
          "- Technology or pattern used (inferred from shape/color/label)",
          "- Responsibilities and interfaces",
          "",
          "### 3. Architecture",
          "Describe the overall architecture pattern (microservices, event-driven, etc.).",
          "Reference the edges to explain how components communicate.",
          "",
          "### 4. Data Flow",
          "Trace the flow of data through the system from entry to exit.",
          "Use the edge connections and labels to describe each path.",
          "",
          "### 5. Key Decisions",
          "List notable design decisions and their rationale.",
          "Infer these from the component choices and structure.",
          "",
          "### 6. Non-Functional Requirements",
          "Infer likely requirements for scalability, security, and reliability.",
          "",
          "## Shape Conventions",
          "- rectangle → general service / component",
          "- diamond → decision / gateway / router",
          "- circle → event / endpoint",
          "- pill → service / process",
          "- cylinder → database / storage / cache",
          "- hexagon → external system / boundary / integration",
          "",
          "## Color Conventions",
          "- neutral dark → default / general",
          "- blue → API / application logic",
          "- purple → external / third-party",
          "- orange → events / messaging",
          "- red → critical / auth / errors",
          "- pink → UI / frontend",
          "- green → data / storage",
          "- teal → infrastructure / networking",
          "",
          "## Formatting Rules",
          "- Use proper Markdown headings (##, ###)",
          "- Use bullet points for lists",
          "- Use code blocks for technology names or code snippets",
          "- Be concise but thorough",
          "- Write in present tense",
          "- Do not include a title heading — start with the Overview section",
        ].join("\n"),
        prompt: [
          chatContext
            ? `## Conversation Context\n${chatContext}\n`
            : null,
          `## Canvas Nodes (${nodeSummary.length})`,
          nodeSummary.length > 0
            ? nodeSummary
                .map(
                  (n) =>
                    `- **${n.label || n.id}** (${n.shape}) at position (${n.x}, ${n.y})`
                )
                .join("\n")
            : "No nodes on the canvas.",
          "",
          `## Canvas Edges (${edgeSummary.length})`,
          edgeSummary.length > 0
            ? edgeSummary
                .map(
                  (e) =>
                    `- ${e.source} → ${e.target}${e.label ? ` (${e.label})` : ""}`
                )
                .join("\n")
            : "No edges on the canvas.",
        ]
          .filter(Boolean)
          .join("\n"),
      });

      if (!specContent || specContent.trim().length === 0) {
        throw new Error("AI returned empty spec content");
      }

      console.log(
        `[generate-spec] Generated spec: ${specContent.length} characters`
      );

      await postToAiFeed(roomId, {
        text: "Saving specification…",
        phase: "generating",
      });

      // ── 3. Upload Markdown to Vercel Blob ─────────────────────────
      const specId = `spec-${Date.now()}`;
      const blobName = `specs/${projectId}/${specId}.md`;

      const blob = await put(blobName, specContent, {
        access: "private",
        addRandomSuffix: true,
        contentType: "text/markdown",
      });

      console.log(`[generate-spec] Uploaded spec to ${blob.url}`);

      // ── 4. Create ProjectSpec record in database ──────────────────
      const projectSpec = await prisma.projectSpec.create({
        data: {
          projectId,
          filePath: blob.url,
        },
      });

      console.log(`[generate-spec] Created ProjectSpec ${projectSpec.id}`);

      await postToAiFeed(roomId, {
        text: "Specification generated successfully",
        phase: "complete",
      });

      return {
        projectId,
        roomId,
        specId: projectSpec.id,
        spec: specContent,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[generate-spec] Failed: ${errorMessage}`);

      await postToAiFeed(roomId, {
        text: `Spec generation failed: ${
          errorMessage.length > 120
            ? errorMessage.slice(0, 120) + "…"
            : errorMessage
        }`,
        phase: "failed",
      });

      throw error;
    } finally {
      await setAiPresence(roomId, false);
    }
  },
});

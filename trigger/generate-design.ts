import { task } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";

/**
 * Input for the AI design generation task.
 */
export type GenerateDesignPayload = {
  /** The project ID to generate a design for */
  projectId: string;
  /** The natural language prompt describing the system */
  prompt: string;
  /** Current canvas state (existing nodes and edges) for context */
  currentCanvas: {
    nodes: unknown[];
    edges: unknown[];
  };
};

/**
 * AI Design Generation
 *
 * Takes a user prompt and current canvas state, generates architecture
 * nodes and edges, then writes them back into the shared Liveblocks room.
 *
 * Triggered from `POST /api/projects/[projectId]/generate-design`.
 */
export const generateDesign = task({
  id: "generate-design",
  run: async (payload: GenerateDesignPayload) => {
    const { projectId, prompt, currentCanvas } = payload;

    console.log(`Generating design for project ${projectId}: "${prompt}"`);

    // Verify the project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // ── AI generation logic goes here ──────────────────────────────
    // 1. Call the LLM with the prompt + current canvas context
    // 2. Parse the response into nodes and edges
    // 3. Write the generated nodes/edges into the Liveblocks room
    //    via the Liveblocks REST API or the Liveblocks SDK
    //
    // const result = await callLLM(prompt, currentCanvas);
    // await liveblocks.updateRoom(...);

    return {
      projectId,
      prompt,
      generated: {
        nodes: [], // generated nodes
        edges: [], // generated edges
      },
      timestamp: new Date().toISOString(),
    };
  },
});

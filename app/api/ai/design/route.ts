import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { designAgent } from "@/trigger/design-agent";

/**
 * POST /api/ai/design
 *
 * Triggers an AI design generation background task and returns the run ID.
 *
 * Body:
 *   - prompt: string     — the design prompt
 *   - roomId: string     — the Liveblocks room / canvas ID
 *   - projectId: string  — the project to associate the run with
 *
 * Returns:
 *   - { data: { runId: string } } — the Trigger.dev run ID
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { prompt?: string; roomId?: string; projectId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.prompt || !body.roomId || !body.projectId) {
    return Response.json(
      { error: "prompt, roomId, and projectId are required" },
      { status: 400 }
    );
  }

  // Trigger the design task through Trigger.dev
  const handle = await designAgent.trigger({
    prompt: body.prompt,
    roomId: body.roomId,
    projectId: body.projectId,
  });

  // Record the task run for ownership tracking
  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: body.projectId,
      userId,
    },
  });

  return Response.json({ data: { runId: handle.id } }, { status: 201 });
}

import { auth as clerkAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth as triggerAuth } from "@trigger.dev/sdk";

/**
 * POST /api/ai/design/token
 *
 * Generates a Trigger.dev public token scoped to a specific run.
 * Verifies the requesting user owns the run before issuing the token.
 *
 * Body:
 *   - runId: string — the Trigger.dev run ID
 *
 * Returns:
 *   - { data: { token: string } } — the run-scoped public token
 */
export async function POST(request: NextRequest) {
  const { userId } = await clerkAuth();

  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { runId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.runId) {
    return Response.json({ error: "runId is required" }, { status: 400 });
  }

  // Verify ownership
  const taskRun = await prisma.taskRun.findUnique({
    where: { runId: body.runId },
  });

  if (!taskRun) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }

  if (taskRun.userId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Generate a Trigger.dev public token scoped to this run
  const token = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: [body.runId],
      },
    },
    expirationTime: "1h",
  });

  return Response.json({ data: { token } });
}

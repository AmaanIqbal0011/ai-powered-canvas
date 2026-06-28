import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { liveblocks } from "@/lib/liveblocks";
import { getIdentity, canAccessProject } from "@/lib/project-access";
import { generateSpec } from "@/trigger/generate-spec";

const SpecRequestSchema = z.object({
  roomId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = SpecRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { roomId } = parsed.data;

  // Resolve project from roomId — do NOT trust a client-supplied projectId
  const project = await prisma.project.findUnique({
    where: { id: roomId },
    select: { id: true },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Verify access — owner or collaborator
  const identity = await getIdentity();
  if (!identity || !(await canAccessProject(roomId, identity))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Read canvas state from Liveblocks (server-side, like design agent)
  const storageDoc = await liveblocks.getStorageDocument(roomId, "json");
  const flow = (storageDoc as Record<string, unknown>)?.flow as
    | Record<string, unknown>
    | undefined;
  const nodesObj = flow?.nodes as Record<string, unknown> | undefined;
  const edgesObj = flow?.edges as Record<string, unknown> | undefined;

  const nodes = nodesObj
    ? Object.entries(nodesObj).map(([id, node]) => {
        const n = node as Record<string, unknown>;
        return { id, ...n };
      })
    : [];
  const edges = edgesObj
    ? Object.entries(edgesObj).map(([id, edge]) => {
        const e = edge as Record<string, unknown>;
        return { id, ...e };
      })
    : [];

  // Trigger the spec generation task
  const handle = await generateSpec.trigger({
    projectId: project.id,
    roomId,
    chatHistory: [],
    nodes,
    edges,
  });

  // Record the task run for ownership tracking
  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: project.id,
      userId,
    },
  });

  return Response.json({ data: { runId: handle.id } }, { status: 201 });
}

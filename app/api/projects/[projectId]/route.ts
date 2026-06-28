import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/projects/[projectId] — rename a project.
 * Only the project owner can rename. Non-owners receive 403.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId } = await params;

  // Fetch project to verify ownership
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || !body.name.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { name: body.name.trim() },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json({ data: updated });
}

/**
 * DELETE /api/projects/[projectId] — delete a project.
 * Only the project owner can delete. Non-owners receive 403.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId } = await params;

  // Fetch project to verify ownership
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  return Response.json({ data: { id: projectId } });
}

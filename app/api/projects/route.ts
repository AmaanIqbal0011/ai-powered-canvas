import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/projects — list the current user's projects.
 * Returns projects owned by the authenticated user, ordered by most recent.
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json({ data: projects });
}

/**
 * POST /api/projects — create a new project.
 * The authenticated user becomes the project owner.
 * Name defaults to "Untitled Project" when omitted.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { id?: string; name?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim() || "Untitled Project";
  const customId = body.id?.trim();

  const project = await prisma.project.create({
    data: {
      ...(customId ? { id: customId } : {}),
      ownerId: userId,
      name,
      description: body.description ?? null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json({ data: project }, { status: 201 });
}

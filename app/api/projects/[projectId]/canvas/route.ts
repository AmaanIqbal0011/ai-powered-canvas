import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { put, get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/projects/[projectId]/canvas
 *
 * Save the current canvas state (nodes and edges) to Vercel Blob.
 * Both the project owner and collaborators can save.
 *
 * Body: { nodes: CanvasNode[], edges: CanvasEdge[] }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId } = await params;

  // Verify project exists and user has access (owner or collaborator)
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const isOwner = project.ownerId === userId;

  if (!isOwner) {
    // Check collaborator access
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const collaboration = await prisma.projectCollaborator.findUnique({
      where: { projectId_email: { projectId, email } },
      select: { id: true },
    });

    if (!collaboration) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Parse canvas state from request body
  let body: { nodes?: unknown; edges?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.nodes || !body.edges) {
    return Response.json(
      { error: "Both 'nodes' and 'edges' are required" },
      { status: 400 }
    );
  }

  // Serialize canvas state as JSON and upload to Vercel Blob
  const canvasJson = JSON.stringify({ nodes: body.nodes, edges: body.edges });
  const blobName = `projects/${projectId}/canvas-${Date.now()}.json`;

  const blob = await put(blobName, canvasJson, {
    access: "private",
    addRandomSuffix: true,
    contentType: "application/json",
    allowOverwrite: true,

  });

  // Store the blob URL on the project record
  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: blob.url },
  });

  return Response.json({
    data: { url: blob.url, savedAt: new Date().toISOString() },
  });
}

/**
 * GET /api/projects/[projectId]/canvas
 *
 * Load the saved canvas state from Vercel Blob.
 * Both the project owner and collaborators can load.
 *
 * Returns: { nodes: CanvasNode[], edges: CanvasEdge[] }
 * Returns 404 when no saved canvas exists.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId } = await params;

  // Verify project exists and user has access
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, canvasJsonPath: true },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const isOwner = project.ownerId === userId;

  if (!isOwner) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const collaboration = await prisma.projectCollaborator.findUnique({
      where: { projectId_email: { projectId, email } },
      select: { id: true },
    });

    if (!collaboration) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Check if there's a saved canvas blob URL
  if (!project.canvasJsonPath) {
    return Response.json(
      { error: "No saved canvas found" },
      { status: 404 }
    );
  }

  // Fetch the canvas JSON from Vercel Blob using the SDK
  try {
    const blobResult = await get(project.canvasJsonPath, {
      access: "private",
    });
    if (!blobResult) {
      return Response.json(
        { error: "Failed to fetch saved canvas" },
        { status: 502 }
      );
    }
    const canvasState = await new Response(blobResult.stream).json();
    return Response.json(canvasState);
  } catch {
    return Response.json(
      { error: "Failed to fetch saved canvas" },
      { status: 502 }
    );
  }
}

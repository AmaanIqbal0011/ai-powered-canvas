import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Lightweight collaborator shape returned to the client,
 * enriched with Clerk display name and avatar when available.
 */
export interface CollaboratorItem {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────

/**
 * Enrich a list of collaborator records with Clerk user data
 * (display name and avatar image) by looking up each email.
 *
 * Falls back to showing the email only when no Clerk user is found.
 */
async function enrichCollaborators(
  collaborators: { id: string; email: string; createdAt: Date }[]
): Promise<CollaboratorItem[]> {
  if (collaborators.length === 0) return [];

  const client = await clerkClient();

  // Batch-fetch Clerk users for all collaborator emails
  const emails = collaborators.map((c) => c.email);
  const clerkUsers = await client.users.getUserList({
    emailAddress: emails,
    limit: emails.length,
  });

  // Build a lookup: email → Clerk user
  const clerkByEmail = new Map(
    clerkUsers.data.map((u) => [
      u.emailAddresses[0]?.emailAddress,
      u,
    ])
  );

  return collaborators.map((c) => {
    const clerkUser = clerkByEmail.get(c.email);
    return {
      id: c.id,
      email: c.email,
      name:
        clerkUser && (clerkUser.firstName || clerkUser.lastName)
          ? [clerkUser.firstName, clerkUser.lastName]
              .filter(Boolean)
              .join(" ")
          : null,
      avatarUrl: clerkUser?.imageUrl ?? null,
      createdAt: c.createdAt.toISOString(),
    };
  });
}

// ── Route Handlers ─────────────────────────────────────────

/**
 * GET /api/projects/[projectId]/collaborators
 *
 * Lists all collaborators on a project.
 * Available to both the owner and any existing collaborator.
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

  // Fetch project to verify existence and get owner ID
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Both the owner and existing collaborators can view the list
  const isOwner = project.ownerId === userId;

  if (!isOwner) {
    // Check if the requester is a collaborator
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

  // Fetch collaborators
  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, createdAt: true },
  });

  // Enrich with Clerk user data
  const enriched = await enrichCollaborators(collaborators);

  return Response.json({ data: enriched });
}

/**
 * POST /api/projects/[projectId]/collaborators
 *
 * Invite a collaborator by email.
 * Owner only — collaborators receive 403.
 *
 * Body: { email: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId } = await params;

  // Verify ownership
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

  // Parse and validate input
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Prevent adding the owner as a collaborator
  const client = await clerkClient();
  const currentUser = await client.users.getUser(userId);
  const ownerEmail = currentUser.emailAddresses[0]?.emailAddress;
  if (ownerEmail && email === ownerEmail.toLowerCase()) {
    return Response.json(
      { error: "Cannot add yourself as a collaborator" },
      { status: 400 }
    );
  }

  // Check for duplicate
  const existing = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email } },
    select: { id: true },
  });

  if (existing) {
    return Response.json(
      { error: "Already a collaborator" },
      { status: 409 }
    );
  }

  // Create the collaborator record
  const collaborator = await prisma.projectCollaborator.create({
    data: { projectId, email },
    select: { id: true, email: true, createdAt: true },
  });

  // Enrich the single new collaborator before returning
  const [enriched] = await enrichCollaborators([collaborator]);

  return Response.json({ data: enriched }, { status: 201 });
}

/**
 * DELETE /api/projects/[projectId]/collaborators
 *
 * Remove a collaborator by email.
 * Owner only — collaborators receive 403.
 *
 * Body: { email: string }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId } = await params;

  // Verify ownership
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

  // Parse input
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  // Find and delete the collaborator
  const collaborator = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email } },
    select: { id: true },
  });

  if (!collaborator) {
    return Response.json(
      { error: "Collaborator not found" },
      { status: 404 }
    );
  }

  await prisma.projectCollaborator.delete({
    where: { id: collaborator.id },
  });

  return Response.json({ data: { email } });
}

import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Minimal identity shape: Clerk user ID and primary email address.
 */
export interface Identity {
  userId: string;
  email: string;
}

/**
 * Resolve the current Clerk user's identity.
 * Returns null when the user is not signed in or has no email on record.
 *
 * Must be called from a server component or route handler.
 */
export async function getIdentity(): Promise<Identity | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;

  if (!email) return null;

  return { userId, email };
}

/**
 * Check whether an identity has access to a project.
 *
 * Access is granted when the identity is the project owner **or** a
 * collaborator listed by email in the ProjectCollaborator table.
 *
 * Returns `false` for both non-existent and unauthorised projects
 * (callers treat both as "denied").
 *
 * Must be called from a server component or route handler.
 */
export async function canAccessProject(
  projectId: string,
  identity: Identity
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) return false;

  // Owner always has access
  if (project.ownerId === identity.userId) return true;

  // Check collaborator access by email
  const collaboration = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_email: { projectId, email: identity.email },
    },
    select: { id: true },
  });

  return collaboration !== null;
}

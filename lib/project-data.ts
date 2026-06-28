import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getIdentity } from "@/lib/project-access";

/**
 * Lightweight project shape returned to the client.
 * Matches what the sidebar and dialogs need — no heavy fields.
 */
export interface ProjectListItem {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetch projects owned by the authenticated user.
 * Must be called from a server component or route handler.
 */
export async function getOwnedProjects(): Promise<ProjectListItem[]> {
  const { userId } = await auth();
  if (!userId) return [];

  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Fetch projects shared with the authenticated user via email-based
 * ProjectCollaborator records.
 * Must be called from a server component or route handler.
 */
export async function getSharedProjects(): Promise<ProjectListItem[]> {
  const identity = await getIdentity();
  if (!identity?.email) return [];

  const collaborations = await prisma.projectCollaborator.findMany({
    where: { email: identity.email },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return collaborations.map((c) => c.project);
}

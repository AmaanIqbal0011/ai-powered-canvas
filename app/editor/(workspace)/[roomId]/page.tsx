import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getIdentity, canAccessProject } from "@/lib/project-access";
import { AccessDenied } from "@/components/editor/access-denied";
import { CanvasWrapper } from "@/components/editor/canvas-wrapper";

/**
 * Workspace room page — server component.
 *
 * Performs server-side access checks before rendering the workspace:
 * - Redirects unauthenticated users to /sign-in
 * - Shows AccessDenied for missing or unauthorized projects
 *
 * The actual canvas is rendered by the client-side CanvasWrapper
 * component which sets up the Liveblocks room and React Flow.
 */
export default async function WorkspaceRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  // Authenticated?
  const identity = await getIdentity();
  if (!identity) redirect("/sign-in");

  // Fetch project existence and owner in one query.
  const project = await prisma.project.findUnique({
    where: { id: roomId },
    select: { name: true, ownerId: true },
  });

  // Owner check first (fast path, no extra DB query).
  const isOwner = project?.ownerId === identity.userId;
  // Collaborator check only when the user is not the owner.
  const hasAccess =
    project !== null &&
    (isOwner || (await canAccessProject(roomId, identity)));

  if (!hasAccess) {
    return (
      <div className="flex h-full w-full">
        <AccessDenied />
      </div>
    );
  }

  return <CanvasWrapper roomId={roomId} />;
}

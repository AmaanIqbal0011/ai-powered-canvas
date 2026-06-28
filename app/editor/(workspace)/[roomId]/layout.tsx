import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getOwnedProjects, getSharedProjects } from "@/lib/project-data";
import { WorkspaceShell } from "@/components/editor/workspace-shell";

/**
 * Workspace room layout.
 *
 * Server component that fetches project list for the sidebar and wraps
 * children in the workspace shell (navbar + sidebar + dialog context).
 */
export default async function WorkspaceRoomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ roomId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { roomId } = await params;

  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(),
    getSharedProjects(),
  ]);

  return (
    <WorkspaceShell
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
      currentUserId={userId}
      roomId={roomId}
    >
      {children}
    </WorkspaceShell>
  );
}

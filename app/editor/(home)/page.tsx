import { auth } from "@clerk/nextjs/server";

import {
  getOwnedProjects,
  getSharedProjects,
} from "@/lib/project-data";
import { getIdentity } from "@/lib/project-access";
import { EditorDashboard } from "@/components/editor/editor-dashboard";

/**
 * Editor home page (server component).
 *
 * Fetches owned and shared projects and resolves the current user.
 * The data is passed to the client `EditorDashboard` for rendering —
 * keeping server-only infra (Prisma auth) on the server.
 */
export default async function EditorHomePage() {
  const { userId } = await auth();
  const identity = await getIdentity();

  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(),
    getSharedProjects(),
  ]);

  return (
    <EditorDashboard
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
      currentUserName={
        identity?.email?.split("@")[0] ?? identity?.userId ?? null
      }
      currentUserId={userId ?? ""}
    />
  );
}

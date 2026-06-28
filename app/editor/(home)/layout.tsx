import { auth } from "@clerk/nextjs/server";

import { getOwnedProjects, getSharedProjects } from "@/lib/project-data";
import { EditorClientShell } from "./editor-client-shell";

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const uid = userId ?? "";

  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(),
    getSharedProjects(),
  ]);

  return (
    <div className="flex h-screen flex-col">
      <EditorClientShell
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        currentUserId={uid}
      >
        {children}
      </EditorClientShell>
    </div>
  );
}

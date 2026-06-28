import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIdentity, canAccessProject } from "@/lib/project-access";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getIdentity();
  if (!identity) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId } = await params;

  if (!(await canAccessProject(projectId, identity))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const specs = await prisma.projectSpec.findMany({
    where: { projectId },
    select: {
      id: true,
      filePath: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: specs });
}

import { NextRequest } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getIdentity, canAccessProject } from "@/lib/project-access";

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ projectId: string; specId: string }>;
  }
) {
  const identity = await getIdentity();
  if (!identity) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId, specId } = await params;

  if (!(await canAccessProject(projectId, identity))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const spec = await prisma.projectSpec.findUnique({
    where: { id: specId },
    select: { projectId: true, filePath: true },
  });

  if (!spec) {
    return Response.json({ error: "Spec not found" }, { status: 404 });
  }

  if (spec.projectId !== projectId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const blobResult = await get(spec.filePath, {
      access: "private",
    });

    if (!blobResult) {
      return Response.json(
        { error: "Failed to fetch spec content" },
        { status: 502 }
      );
    }

    const content = await new Response(blobResult.stream).text();

    return Response.json({ data: { content } });
  } catch {
    return Response.json(
      { error: "Failed to fetch spec content" },
      { status: 502 }
    );
  }
}

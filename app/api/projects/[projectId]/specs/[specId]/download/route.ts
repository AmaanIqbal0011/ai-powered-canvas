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

  // Verify project access
  if (!(await canAccessProject(projectId, identity))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify the spec belongs to this project
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

  // Fetch the Markdown file from Vercel Blob
  try {
    const blobResult = await get(spec.filePath, {
      access: "private",
    });

    if (!blobResult) {
      return Response.json(
        { error: "Failed to fetch spec file" },
        { status: 502 }
      );
    }

    const content = await new Response(blobResult.stream).text();

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="spec-${specId}.md"`,
      },
    });
  } catch {
    return Response.json(
      { error: "Failed to fetch spec file" },
      { status: 502 }
    );
  }
}

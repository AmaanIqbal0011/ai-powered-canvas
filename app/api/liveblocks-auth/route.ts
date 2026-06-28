import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { liveblocks, getCursorColor } from "@/lib/liveblocks";
import { getIdentity, canAccessProject } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/liveblocks-auth
 *
 * Issues a Liveblocks ID token for the current user to join a specific room.
 *
 * Flow:
 *  1. Authenticate via Clerk — returns 401 if unauthenticated.
 *  2. Parse `roomId` from the request body — returns 400 if missing.
 *  3. Verify project access via `canAccessProject` — returns 403 if denied.
 *  4. Ensure the Liveblocks room exists with `room:write` access for the
 *     owner and all project collaborators — returns 404/500 on failure.
 *  5. Resolve user display name and avatar from Clerk.
 *  6. Generate a deterministic cursor color from the user ID.
 *  7. Return a Liveblocks ID token session with user metadata attached.
 */
export async function POST(request: Request) {
  // ── 1. Clerk authentication ───────────────────────────────────────
  const identity = await getIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Parse room ID ──────────────────────────────────────────────
  // Liveblocks sends the room as `{ room: "<id>" }` in the request body.
  // Also support `?room=<id>` query param for custom callers.
  const { searchParams } = new URL(request.url);
  let roomId = searchParams.get("room");

  if (!roomId) {
    try {
      const body = await request.json();
      roomId = body.room;
    } catch {
      // body is optional — room may already be in the query param
    }
  }

  if (typeof roomId !== "string" || roomId.length === 0) {
    return NextResponse.json(
      { error: "roomId is required" },
      { status: 400 }
    );
  }

  // ── 3. Verify project access ──────────────────────────────────────
  const hasAccess = await canAccessProject(roomId, identity);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 4. Ensure the Liveblocks room exists with access for all ──────
  // authorized users (owner + collaborators). We use upsertRoom so that
  // when a new collaborator is added, the next auth request updates the
  // room's user access list.
  try {
    // Fetch the project owner
    const project = await prisma.project.findUnique({
      where: { id: roomId },
      select: { ownerId: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get all collaborator emails for this project
    const collaborators = await prisma.projectCollaborator.findMany({
      where: { projectId: roomId },
      select: { email: true },
    });

    // Resolve collaborator emails to Clerk user IDs in a single batch call
    const clerk = await clerkClient();
    const emails = collaborators.map((c) => c.email);
    let collaboratorUserIds: string[] = [];

    if (emails.length > 0) {
      const clerkUsers = await clerk.users.getUserList({
        emailAddress: emails,
        limit: emails.length,
      });
      collaboratorUserIds = clerkUsers.data
        .map((u) => u.id)
        .filter((id) => id !== project.ownerId);
    }

    // Build the full access map: owner + all collaborators
    const authorizedUserIds = [project.ownerId, ...collaboratorUserIds];
    const usersAccesses: Record<string, ["room:write"]> = {};
    for (const uid of authorizedUserIds) {
      usersAccesses[uid] = ["room:write"];
    }

    await liveblocks.upsertRoom(roomId, {
      create: {
        defaultAccesses: [],
        usersAccesses,
      },
      update: {
        usersAccesses,
      },
    });
  } catch (error) {
    console.error("Failed to set up Liveblocks room:", error);
    return NextResponse.json(
      { error: "Failed to initialize room" },
      { status: 500 }
    );
  }

  // ── 5. Resolve user details from Clerk ────────────────────────────
  const client = await clerkClient();
  const user = await client.users.getUser(identity.userId);
  const name =
    user.fullName || user.username || identity.email || "Anonymous";
  const avatar = user.imageUrl;

  // ── 6. Generate cursor color ────────────────────────────────────
  const color = getCursorColor(identity.userId);

  // ── 7. Issue session token with user metadata ─────────────────────
  const { status, body: tokenBody } = await liveblocks.identifyUser(
    {
      userId: identity.userId,
      groupIds: [],
    },
    {
      userInfo: { name, avatar, color },
    }
  );

  return new Response(tokenBody, { status });
}

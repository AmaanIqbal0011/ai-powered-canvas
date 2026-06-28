"use client";

import { useOthers } from "@liveblocks/react";
import { useUser } from "@clerk/nextjs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";

/**
 * Displays other participants' avatars in the top-right corner of the canvas.
 *
 * - Gets the current user from the active Clerk session
 * - Filters the Liveblocks presence list to exclude any entry whose user ID
 *   matches the current Clerk user ID
 * - Renders the filtered list as collaborator avatars only
 * - Shows up to five collaborator avatars in an overlapping stack
 * - Shows a +N overflow chip when there are more than five
 * - Shows a vertical divider between collaborator avatars and the Clerk
 *   UserButton only when at least one collaborator exists
 * - If no collaborators are present, renders nothing (the Clerk UserButton in
 *   the navbar stands alone)
 *
 * Collaborator avatars are display-only, not interactive.
 */
export function PresenceAvatars() {
  const { user } = useUser();
  const others = useOthers();

  if (!user) return null;

  // Filter out the current user (safety net — useOthers already excludes the
  // current client, but we cross-check against the Clerk user ID).
  const collaborators = others.filter((other) => other.id !== user.id);

  if (collaborators.length === 0) return null;

  const visible = collaborators.slice(0, 5);
  const overflow = collaborators.length - 5;

  return (
    <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
      <AvatarGroup>
        {visible.map((other) => (
          <Avatar
            key={other.id ?? other.connectionId}
            size="sm"
            title={other.info?.name ?? "Anonymous"}
          >
            {other.info?.avatar ? (
              <AvatarImage
                src={other.info.avatar}
                alt={other.info.name ?? ""}
              />
            ) : null}
            <AvatarFallback
              className="text-[10px] font-medium"
              style={{
                backgroundColor: other.info?.color ?? "#666",
                color: "#fff",
              }}
            >
              {(other.info?.name ?? "?")[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
        ))}
        {overflow > 0 && <AvatarGroupCount>+{overflow}</AvatarGroupCount>}
      </AvatarGroup>

      {/* Divider between collaborator avatars and Clerk UserButton */}
      <div className="h-5 w-px bg-border-default" />
    </div>
  );
}

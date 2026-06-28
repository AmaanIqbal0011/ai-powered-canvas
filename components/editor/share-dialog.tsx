"use client";

import {
  Check,
  Copy,
  Loader2,
  Mail,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useShareDialog } from "@/hooks/use-share-dialog";
import { cn } from "@/lib/utils";

interface ShareDialogProps {
  /** The project / room ID to share. */
  projectId: string;
  /** Whether the current user is the project owner. */
  isOwner: boolean;
  /** Controlled by the parent shell. */
  open: boolean;
  onClose: () => void;
}

/**
 * Share dialog opened from the workspace navbar.
 *
 * Owners can:
 *  - Invite collaborators by email
 *  - View the current collaborator list
 *  - Remove collaborators
 *  - Copy the project link (with temporary "Copied!" feedback)
 *
 * Collaborators can only view the list.
 */
export function ShareDialog({
  projectId,
  isOwner,
  open,
  onClose,
}: ShareDialogProps) {
  const {
    collaborators,
    isLoadingList,
    email,
    setEmail,
    isInviting,
    inviteError,
    invite,
    remove,
    copied,
    copyLink,
  } = useShareDialog({ projectId, isOwner });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>
            {isOwner
              ? "Invite collaborators to this workspace."
              : "People with access to this project."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── Copy link ── */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                readOnly
                value={
                  typeof window !== "undefined"
                    ? window.location.href
                    : ""
                }
                className="pr-10 text-sm text-copy-muted"
                onClick={(e) => e.currentTarget.select()}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              className={cn(
                "shrink-0 transition-colors",
                copied && "border-success text-success"
              )}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* ── Invite form (owner only) ── */}
          {isOwner && (
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label
                  htmlFor="invite-email"
                  className="text-xs font-medium text-copy-secondary"
                >
                  Invite by email
                </label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && email.trim() && !isInviting) {
                      invite();
                    }
                  }}
                  autoFocus
                />
                {inviteError && (
                  <p className="text-xs text-error">{inviteError}</p>
                )}
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={invite}
                disabled={!email.trim() || isInviting}
                className="shrink-0"
              >
                {isInviting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
                Invite
              </Button>
            </div>
          )}

          {/* ── Collaborator list ── */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-copy-muted">
              {isLoadingList
                ? "Loading…"
                : `${collaborators.length} collaborator${collaborators.length !== 1 ? "s" : ""}`}
            </p>

            {isLoadingList ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-copy-muted" />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Mail className="h-8 w-8 text-copy-faint" />
                <p className="text-sm text-copy-muted">
                  No collaborators yet.
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-52">
                <div className="flex flex-col gap-1">
                  {collaborators.map((collab) => (
                    <div
                      key={collab.id}
                      className="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-subtle"
                    >
                      <Avatar size="sm">
                        {collab.avatarUrl ? (
                          <AvatarImage
                            src={collab.avatarUrl}
                            alt={collab.name ?? collab.email}
                          />
                        ) : (
                          <AvatarFallback>
                            {(collab.name ?? collab.email)
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-copy-primary">
                          {collab.name ?? collab.email}
                        </p>
                        {collab.name && (
                          <p className="truncate text-xs text-copy-muted">
                            {collab.email}
                          </p>
                        )}
                      </div>

                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => remove(collab.email)}
                          aria-label={`Remove ${collab.email}`}
                          className="shrink-0 opacity-0 group-hover:opacity-100 text-copy-muted hover:text-error"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

import type { CollaboratorItem } from "@/app/api/projects/[projectId]/collaborators/route";

interface UseShareDialogOptions {
  projectId: string;
  isOwner: boolean;
}

interface UseShareDialogReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;

  /** List of enriched collaborators. */
  collaborators: CollaboratorItem[];
  /** True while the initial GET is in flight. */
  isLoadingList: boolean;

  /** Email the owner is typing into the invite field. */
  email: string;
  setEmail: (val: string) => void;

  /** True while the POST is in flight. */
  isInviting: boolean;
  /** Error string from the last invite attempt, or null. */
  inviteError: string | null;
  /** Invite a collaborator. Clears the email field on success. */
  invite: () => Promise<void>;

  /** Remove a collaborator by email. */
  remove: (email: string) => Promise<void>;

  /** Copied! feedback state for the copy-link button. */
  copied: boolean;
  /** Copy the current page URL to the clipboard. */
  copyLink: () => Promise<void>;
}

/**
 * Hook that powers the share-dialog: loads the collaborator list,
 * handles invite/remove API calls, and manages copy-link feedback.
 */
export function useShareDialog({
  projectId,
  isOwner,
}: UseShareDialogOptions): UseShareDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Fetch collaborators ──────────────────────────────────

  // Fetch on open; abort previous request on cleanup to avoid races.
  useEffect(() => {
    if (!isOpen) return;

    const abort = new AbortController();

    (async () => {
      setIsLoadingList(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/collaborators`, {
          signal: abort.signal,
        });
        if (!res.ok) {
          console.error("Failed to fetch collaborators:", res.status);
          return;
        }
        const json = await res.json();
        if (!abort.signal.aborted) {
          setCollaborators(json.data ?? []);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Failed to fetch collaborators:", err);
      } finally {
        if (!abort.signal.aborted) {
          setIsLoadingList(false);
        }
      }
    })();

    return () => abort.abort();
  }, [isOpen, projectId]);

  // ── Invite ────────────────────────────────────────────────

  const invite = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || !isOwner) return;

    setIsInviting(true);
    setInviteError(null);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        setInviteError(json.error ?? "Failed to invite collaborator");
        return;
      }

      // Add the enriched collaborator to the local list
      setCollaborators((prev) => [...prev, json.data]);
      setEmail("");
    } catch (err) {
      console.error("Invite collaborator error:", err);
      setInviteError("Something went wrong. Please try again.");
    } finally {
      setIsInviting(false);
    }
  }, [email, isOwner, projectId]);

  // ── Remove ────────────────────────────────────────────────

  const remove = useCallback(
    async (targetEmail: string) => {
      if (!isOwner) return;

      try {
        const res = await fetch(
          `/api/projects/${projectId}/collaborators`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: targetEmail }),
          }
        );

        if (!res.ok) {
          console.error("Failed to remove collaborator:", res.status);
          return;
        }

        setCollaborators((prev) =>
          prev.filter((c) => c.email !== targetEmail)
        );
      } catch (err) {
        console.error("Remove collaborator error:", err);
      }
    },
    [isOwner, projectId]
  );

  // ── Copy link ─────────────────────────────────────────────

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available
      console.error("Failed to copy link");
    }
  }, []);

  // ── Open / Close ──────────────────────────────────────────

  const open = useCallback(() => {
    setIsOpen(true);
    setInviteError(null);
    setEmail("");
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setInviteError(null);
    setEmail("");
  }, []);

  return {
    isOpen,
    open,
    close,
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
  };
}

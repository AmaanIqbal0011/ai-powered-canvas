import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Full-page access-denied screen shown when a user tries to open a project
 * they do not own (or that does not exist).
 */
export function AccessDenied() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-subtle">
        <Lock className="h-6 w-6 text-copy-muted" />
      </div>
      <h1 className="text-lg font-semibold text-copy-primary">
        Access Denied
      </h1>
      <p className="max-w-sm text-center text-sm text-copy-muted">
        You don&apos;t have access to this project, or it doesn&apos;t exist.
      </p>
      <Button asChild variant="default">
        <Link href="/editor">Back to Projects</Link>
      </Button>
    </div>
  );
}

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left panel — brand + feature list (hidden on small screens) */}
      <div className="hidden flex-1 flex-col justify-center gap-8 bg-base px-12 md:flex">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-copy-primary">
            Ghost AI
          </h1>
          <p className="mt-2 text-sm text-copy-muted">
            Real-time collaborative system design workspace
          </p>
        </div>

        <ul className="space-y-3 text-sm text-copy-secondary">
          <li>Real-time multi-user collaboration</li>
          <li>AI-powered system design assistance</li>
          <li>Drag-and-drop architecture canvas</li>
          <li>Version tracking and spec generation</li>
        </ul>
      </div>

      {/* Right panel — Clerk sign-in form */}
      <div className="flex flex-1 items-center justify-center bg-elevated px-4 py-12">
        <SignIn />
      </div>
    </div>
  );
}

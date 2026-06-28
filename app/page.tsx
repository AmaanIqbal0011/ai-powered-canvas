import {
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold tracking-tight">Ghost AI</h1>
      <p className="text-sm text-copy-muted">
        Real-time collaborative system design workspace
      </p>

      {userId ? (
        <div className="flex items-center gap-4">
          <Link
            href="/editor"
            className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-base transition-opacity hover:opacity-90"
          >
            Open Editor
          </Link>
          <UserButton />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <SignInButton mode="modal">
            <button className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-base transition-opacity hover:opacity-90">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-xl border border-border-default bg-elevated px-4 py-2 text-sm font-medium text-copy-secondary transition-opacity hover:opacity-90">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      )}
    </div>
  );
}

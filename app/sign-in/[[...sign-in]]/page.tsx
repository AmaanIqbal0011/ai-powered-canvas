import { SignIn } from "@clerk/nextjs";

import { AuthPanel } from "@/components/marketing/auth-panel";

/**
 * Sign In page — two-panel layout.
 *
 * - Left: marketing panel with brand, tagline, and feature highlights
 * - Right: Clerk SignIn form, centered within a sticky panel
 *
 * On small screens, only the form panel is shown. The marketing panel
 * collapses to preserve focus on the task of signing in.
 */
export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-base md:flex-row">
      <AuthPanel
        title="Welcome back to your workspace"
        tagline="Sign in to keep designing. Your projects, collaborators, and saved canvases are right where you left them."
        highlight={{
          label: "Active design teams",
          value: "Real-time • AI-assisted",
        }}
      />

      {/* ── Right panel: sign-in form ── */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-base px-4 py-12 sm:px-6 md:py-16">
        <div className="bg-spotlight pointer-events-none absolute inset-0 opacity-50" />

        <div className="relative w-full max-w-md">
          {/* Mobile-only brand mark */}
          <div className="mb-8 flex justify-center md:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-ai shadow-lg shadow-brand/30">
                <svg
                  className="h-4 w-4 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                </svg>
              </div>
              <span className="font-semibold tracking-tight text-copy-primary">
                Ghost AI
              </span>
            </div>
          </div>

          <div className="surface-elevated overflow-hidden rounded-2xl border border-border-default p-1 inset-stroke shadow-2xl shadow-brand/5">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: {
                    backgroundColor: "transparent",
                    boxShadow: "none",
                    border: "none",
                  },
                  headerTitle:
                    "text-xl font-semibold tracking-tight text-copy-primary",
                  headerSubtitle: "text-sm text-copy-muted",
                  socialButtons:
                    "flex flex-col gap-2 [&>button]:rounded-xl [&>button]:border-border-default [&>button]:bg-elevated [&>button]:text-copy-primary [&>button]:transition-all [&>button]:hover:bg-subtle [&>button]:hover:border-border-subtle",
                  socialButtonIcon: "text-copy-secondary",
                  dividerLine: "bg-border-default",
                  dividerText:
                    "text-[11px] uppercase tracking-wider text-copy-muted",
                  formButtonPrimary:
                    "h-10 rounded-xl bg-gradient-to-br from-brand to-ai text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-all hover:shadow-brand/50",
                  formFieldLabel: "text-xs font-medium text-copy-secondary",
                  formFieldInput:
                    "h-10 rounded-xl border-border-default bg-elevated/60 text-copy-primary transition-all focus:border-brand focus:ring-2 focus:ring-brand/30",
                  formFieldInputShowPasswordButton:
                    "text-copy-muted hover:text-copy-primary",
                  footerActionLink: "text-brand hover:text-brand/80 font-medium",
                  identityPreviewEditButton:
                    "text-brand hover:text-brand/80",
                  formFieldRow: "gap-1.5",
                  otpCodeFieldInput:
                    "rounded-lg border-border-default bg-elevated/60 text-copy-primary",
                  alertText: "text-error text-xs",
                  alert:
                    "border border-error/30 bg-error-dim rounded-xl text-error",
                  formResendCodeLink: "text-brand hover:text-brand/80",
                },
              }}
            />
          </div>

          <p className="mt-6 text-center text-xs text-copy-faint">
            Protected by Clerk · Encrypted at rest and in transit
          </p>
        </div>
      </main>
    </div>
  );
}

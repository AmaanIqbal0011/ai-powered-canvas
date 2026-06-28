import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRight,
  Check,
  FileText,
  Layers,
  MousePointerClick,
  Network,
  Share2,
  Shapes,
  Users,
  Wand2,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteLogo } from "@/components/site/site-logo";

// ── Static copy ───────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Wand2,
    title: "AI architects your system",
    body: "Describe your platform in plain English. Ghost AI drafts a complete system architecture directly onto your shared canvas.",
  },
  {
    icon: Users,
    title: "Real-time collaboration",
    body: "Live cursors, presence avatars, instant edge sync. Edit a node from Tokyo and watch it update in Berlin within milliseconds.",
  },
  {
    icon: Layers,
    title: "Six primitive shapes",
    body: "Rectangles, cylinders, hexagons, diamonds, pills and circles — each tuned for services, databases, gateways and decisions.",
  },
  {
    icon: Shapes,
    title: "Starter templates",
    body: "Import production patterns for microservices, CI/CD pipelines, and event-driven systems in a single click.",
  },
  {
    icon: Share2,
    title: "Invite collaborators",
    body: "Share by email. Owners control access, guests co-edit in real-time, and everyone sees the same source of truth.",
  },
  {
    icon: FileText,
    title: "Spec generation",
    body: "Turn your finished graph into a downloadable Markdown spec — auto-formatted with headings, lists, and architecture details.",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Spin up a project",
    body: "Create a workspace in seconds. No infrastructure, no setup — just open the editor and start designing.",
  },
  {
    n: "02",
    title: "Prompt Ghost AI",
    body: "Describe your system in plain language and watch Ghost AI draft nodes and edges onto the canvas for you.",
  },
  {
    n: "03",
    title: "Refine together",
    body: "Drag, connect, recolor. Invite teammates to co-edit live and perfect the architecture before shipping.",
  },
  {
    n: "04",
    title: "Export the spec",
    body: "Generate a Markdown technical spec from your final graph — ready to share, review, or hand off to engineering.",
  },
] as const;

const HIGHLIGHTS = [
  "Unlimited collaborators",
  "Unlimited projects",
  "AI generation included",
  "No credit card required",
] as const;

// ── Component ─────────────────────────────────────────────────────────────

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
      {/* ── Decorative background ── */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-base" />
      <div className="bg-spotlight pointer-events-none absolute inset-0 -z-10 opacity-80" />
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.35]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[640px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 right-0 -z-10 h-96 w-[480px] -translate-y-1/2 rounded-full bg-ai/20 blur-[120px]" />

      {/* ── Top nav ── */}
      <header className="sticky top-0 z-30 w-full border-b border-border-default/40 bg-base/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <SiteLogo />
          <nav className="hidden items-center gap-7 text-sm text-copy-secondary md:flex">
            <a
              href="#features"
              className="transition-colors hover:text-copy-primary"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-copy-primary"
            >
              How it works
            </a>
            <a
              href="#templates"
              className="transition-colors hover:text-copy-primary"
            >
              Templates
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {userId ? (
              <>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
                <Button asChild size="sm" className="gap-1.5">
                  <Link href="/editor">
                    Open editor
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm" className="text-copy-secondary">
                    Sign in
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button
                    size="sm"
                    className="gap-1.5 shadow-lg shadow-brand/20"
                  >
                    Get started free
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28 lg:pt-32">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Badge
            variant="default"
            size="lg"
            className="mb-6 animate-fade-up gap-2 rounded-full border border-brand/30 bg-brand-dim/60 px-3 py-1 text-brand backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-brand/70" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-brand" />
            </span>
            New: Live spec generation from any canvas
          </Badge>

          <h1 className="animate-fade-up text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-copy-primary sm:text-5xl lg:text-6xl">
            Design systems.{" "}
            <span className="text-gradient-brand">Together.</span>
          </h1>
          <p
            className="animate-fade-up mt-6 max-w-2xl text-balance text-base leading-relaxed text-copy-secondary sm:text-lg"
            style={{ animationDelay: "0.1s" }}
          >
            Ghost AI is the collaborative canvas for architecture teams.
            Describe your system once, watch the AI draft it, then refine with
            your team in real time.
          </p>

          <div
            className="animate-fade-up mt-9 flex flex-col items-center gap-3 sm:flex-row"
            style={{ animationDelay: "0.2s" }}
          >
            {userId ? (
              <Button
                asChild
                size="lg"
                className="group gap-2 px-6 shadow-xl shadow-brand/25 ring-1 ring-white/10 hover:shadow-brand/40"
              >
                <Link href="/editor">
                  Open the editor
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            ) : (
              <SignUpButton mode="modal">
                <Button
                  size="lg"
                  className="group gap-2 px-6 shadow-xl shadow-brand/25 ring-1 ring-white/10 hover:shadow-brand/40"
                >
                  Start designing free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </SignUpButton>
            )}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 border-border-default bg-elevated/40 backdrop-blur"
            >
              <a href="#how-it-works">
                <MousePointerClick className="h-4 w-4 text-copy-muted" />
                See how it works
              </a>
            </Button>
          </div>

          <div
            className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-copy-muted"
            style={{ animationDelay: "0.3s" }}
          >
            {HIGHLIGHTS.map((h, i) => (
              <span key={h} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green" />
                {h}
                {i < HIGHLIGHTS.length - 1 && (
                  <span className="ml-2 hidden h-3 w-px bg-border-default sm:inline-block" />
                )}
              </span>
            ))}
          </div>
        </div>

        {/* ── Hero preview ── */}
        <div className="animate-fade-up relative mx-auto mt-16 max-w-6xl">
          <div className="glow-ring relative rounded-3xl">
            <div className="surface-elevated relative overflow-hidden rounded-3xl border border-border-default inset-stroke shadow-2xl shadow-brand/10">
              {/* Mock canvas chrome */}
              <div className="flex h-12 items-center justify-between border-b border-border-default bg-canvas/80 px-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-error/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green/80" />
                </div>
                <div className="hidden gap-2 text-xs text-copy-muted sm:flex">
                  <span>microservices.architecture</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green" />
                  <span className="text-xs text-copy-muted">3 live</span>
                </div>
              </div>

              {/* Mock canvas surface */}
              <div className="relative h-[340px] overflow-hidden bg-canvas sm:h-[420px] lg:h-[480px]">
                <div className="bg-grid absolute inset-0 opacity-50" />

                {/* Animated edges */}
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 800 480"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3a3a42" />
                    </marker>
                  </defs>
                  <path
                    d="M 400 80 L 170 220"
                    stroke="#00c8d4"
                    strokeWidth="1.5"
                    fill="none"
                    markerEnd="url(#arrow)"
                    className="animate-fade-in"
                  />
                  <path
                    d="M 400 80 L 400 220"
                    stroke="#3a3a42"
                    strokeWidth="1.5"
                    fill="none"
                    markerEnd="url(#arrow)"
                  />
                  <path
                    d="M 400 80 L 630 220"
                    stroke="#3a3a42"
                    strokeWidth="1.5"
                    fill="none"
                    markerEnd="url(#arrow)"
                  />
                  <path
                    d="M 170 220 L 400 340"
                    stroke="#3a3a42"
                    strokeWidth="1.5"
                    fill="none"
                    markerEnd="url(#arrow)"
                  />
                  <path
                    d="M 400 220 L 400 340"
                    stroke="#52A8FF"
                    strokeWidth="1.5"
                    fill="none"
                    markerEnd="url(#arrow)"
                  />
                  <path
                    d="M 630 220 L 400 340"
                    stroke="#52A8FF"
                    strokeWidth="1.5"
                    fill="none"
                    markerEnd="url(#arrow)"
                  />
                </svg>

                {/* Mock shapes — visual placeholders */}
                <MockNode
                  x="50%"
                  top="16%"
                  label="API Gateway"
                  fill="#1F1F1F"
                  textColor="#EDEDED"
                  w={160}
                />
                <MockNode
                  left="21%"
                  top="46%"
                  label="Auth"
                  fill="#10233D"
                  textColor="#52A8FF"
                  w={120}
                  shape="pill"
                />
                <MockNode
                  left="50%"
                  top="46%"
                  label="Users"
                  fill="#1F1F1F"
                  textColor="#EDEDED"
                  w={120}
                  shape="pill"
                />
                <MockNode
                  left="78%"
                  top="46%"
                  label="Orders"
                  fill="#331B00"
                  textColor="#FF990A"
                  w={120}
                  shape="pill"
                />
                <MockNode
                  x="50%"
                  top="70%"
                  label="Database"
                  fill="#0F2E18"
                  textColor="#62C073"
                  w={140}
                  shape="cylinder"
                />

                {/* Floating AI hint chip */}
                <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-ai/30 bg-ai/15 px-2.5 py-1 text-[11px] text-ai-text backdrop-blur">
                  <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-ai" />
                  Ghost AI typing…
                </div>

                {/* Floating collaborator avatars */}
                <div className="absolute left-4 top-4 flex -space-x-2">
                  {[
                    "linear-gradient(135deg,#ff6b6b,#ffa94d)",
                    "linear-gradient(135deg,#4dabf7,#748ffc)",
                    "linear-gradient(135deg,#69db7c,#38d9a9)",
                  ].map((bg, i) => (
                    <span
                      key={i}
                      className="h-7 w-7 rounded-full ring-2 ring-canvas"
                      style={{ background: bg }}
                    />
                  ))}
                </div>
              </div>

              {/* Floating control bar */}
              <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
                <div className="flex items-center gap-1.5 rounded-full border border-border-default bg-elevated/90 px-3 py-2 shadow-2xl backdrop-blur">
                  {["rect", "pill", "cylinder", "hex", "diamond", "circle"].map(
                    s => (
                      <span
                        key={s}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-subtle text-copy-muted"
                      >
                        <span className="h-2 w-2 rounded-full bg-current" />
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="ai" className="mb-4 uppercase tracking-wider">
            Features
          </Badge>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-copy-primary sm:text-4xl">
            Everything you need to design a system
          </h2>
          <p className="mt-4 text-balance text-base leading-relaxed text-copy-secondary">
            One workspace for the whole architecture team — from the first
            prompt to the final spec.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-border-default bg-elevated/40 p-6 inset-stroke transition-all duration-300 hover:-translate-y-0.5 hover:border-border-subtle hover:bg-elevated hover:shadow-xl hover:shadow-brand/5"
            >
              <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-brand/0 blur-2xl transition-all duration-500 group-hover:bg-brand/20" />
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand/20 to-ai/20 ring-1 ring-white/5">
                  <f.icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight text-copy-primary">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-copy-muted">
                  {f.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how-it-works"
        className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6"
      >
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4 uppercase tracking-wider">
            How it works
          </Badge>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-copy-primary sm:text-4xl">
            From prompt to spec in four steps
          </h2>
        </div>

        <div className="relative mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, idx) => (
            <div
              key={s.n}
              className="relative flex flex-col rounded-2xl border border-border-default bg-elevated/40 p-6 inset-stroke"
            >
              <span className="font-mono text-xs text-brand">/{s.n}</span>
              <h3 className="mt-3 text-base font-semibold tracking-tight text-copy-primary">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-copy-muted">
                {s.body}
              </p>
              {idx < STEPS.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-border-strong lg:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Template showcase ── */}
      <section
        id="templates"
        className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6"
      >
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="outline" className="mb-4 uppercase tracking-wider">
              <Network className="h-3 w-3" />
              Templates
            </Badge>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-copy-primary sm:text-4xl">
              Production-grade patterns at your fingertips
            </h2>
            <p className="mt-4 text-base leading-relaxed text-copy-secondary">
              Import a microservices, CI/CD pipeline, or event-driven system
              with one click. Every template is editable, shareable, and ready
              to feed straight into the spec generator.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Microservices — gateway, services, shared DB",
                "CI/CD — code → build → test → staging → prod",
                "Event-driven — producer, bus, subscribers",
              ].map(line => (
                <li key={line} className="flex items-center gap-3 text-copy-secondary">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/15 text-brand">
                    <Zap className="h-3 w-3" />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="glow-ring relative rounded-2xl">
              <div className="surface-elevated relative overflow-hidden rounded-2xl border border-border-default p-3 inset-stroke shadow-2xl">
                <div className="rounded-xl bg-canvas p-6">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: "Microservices", tag: "6 nodes" },
                      { name: "CI/CD Pipeline", tag: "6 nodes" },
                      { name: "Event-Driven", tag: "6 nodes" },
                    ].map(t => (
                      <div
                        key={t.name}
                        className="rounded-lg border border-border-default bg-elevated p-3 text-left"
                      >
                        <div className="mb-2 flex h-16 items-center justify-center rounded-md bg-subtle">
                          <Network className="h-5 w-5 text-brand" />
                        </div>
                        <p className="text-xs font-medium text-copy-primary">
                          {t.name}
                        </p>
                        <p className="text-[10px] text-copy-muted">{t.tag}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6">
        <div className="glow-ring relative overflow-hidden rounded-3xl">
          <div className="surface-elevated relative rounded-3xl border border-border-subtle p-12 inset-stroke">
            <div className="bg-spotlight pointer-events-none absolute inset-0 opacity-80" />
            <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-ai/30 blur-3xl" />

            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-copy-primary sm:text-4xl">
                Ready to design faster?
              </h2>
              <p className="mt-4 text-balance text-base leading-relaxed text-copy-secondary">
                Create your first project in seconds. Bring your team in
                instantly. Ship a spec the same day.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {userId ? (
                  <Button
                    asChild
                    size="lg"
                    className="gap-2 px-6 shadow-xl shadow-brand/25 ring-1 ring-white/10"
                  >
                    <Link href="/editor">
                      Open the editor
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <SignUpButton mode="modal">
                    <Button
                      size="lg"
                      className="gap-2 px-6 shadow-xl shadow-brand/25 ring-1 ring-white/10"
                    >
                      Get started — it&apos;s free
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </SignUpButton>
                )}
                <SignInButton mode="modal">
                  <Button size="lg" variant="ghost" className="text-copy-secondary">
                    I already have an account
                  </Button>
                </SignInButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator className="bg-border-default/40" />
      <SiteFooter />
    </div>
  );
}

// ── Mock node visual helper for hero preview ──────────────────────────────

interface MockNodeProps {
  label: string;
  fill: string;
  textColor: string;
  w: number;
  h?: number;
  shape?: "rect" | "pill" | "cylinder" | "hex" | "diamond";
  left?: string;
  x?: string;
  top: string;
}

function MockNode({
  label,
  fill,
  textColor,
  w,
  h,
  shape = "rect",
  left,
  x,
  top,
}: MockNodeProps) {
  const positionStyle = left
    ? { left, transform: "translateX(-50%)" }
    : { left: x ?? "50%", transform: "translateX(-50%)" };

  if (shape === "cylinder") {
    return (
      <div
        className="absolute flex flex-col items-center"
        style={{ ...positionStyle, top, width: w }}
      >
        <div
          className="flex items-center justify-center rounded-md border"
          style={{
            width: w,
            height: h ?? 44,
            backgroundColor: fill,
            borderColor: "#36363f",
            color: textColor,
            borderRadius: 6,
          }}
        >
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span
          className="mt-1 h-1 w-3/4 rounded-b-md"
          style={{ backgroundColor: fill, opacity: 0.6 }}
        />
      </div>
    );
  }

  return (
    <div
      className="absolute flex items-center justify-center text-xs font-medium"
      style={{
        ...positionStyle,
        top,
        width: w,
        height: h ?? 44,
        backgroundColor: fill,
        color: textColor,
        border: "1px solid #36363f",
        borderRadius: shape === "pill" ? 999 : 8,
      }}
    >
      {label}
    </div>
  );
}

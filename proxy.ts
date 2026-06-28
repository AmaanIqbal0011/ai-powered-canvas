import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Public routes — landing page and auth pages
  if (
    req.nextUrl.pathname === "/" ||
    req.nextUrl.pathname === "/sign-in" ||
    req.nextUrl.pathname === "/sign-up" ||
    req.nextUrl.pathname.startsWith("/sign-in/") ||
    req.nextUrl.pathname.startsWith("/sign-up/")
  ) {
    return;
  }

  // Protect all other routes
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files (found in the default Next.js proxy matcher)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

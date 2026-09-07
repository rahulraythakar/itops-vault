import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Everything except the auth pages and the public share-link viewer
// requires a signed-in user. Share links are intentionally public —
// that's how "secure sharing via link" works — but token validity and
// expiry are checked inside that route itself, not here.
// Only the public token-based viewer routes are unauthenticated — the
// share list/create/revoke endpoints under /api/share (no "token"
// segment) still require login, same as everything else.
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/share/(.*)",
  "/api/share/token/(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"]
};

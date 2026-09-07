import { auth } from "@clerk/nextjs/server";

// RBAC read directly from Clerk's session (see Step 2.5 notes). Role keys
// must match the custom roles configured in Clerk: org:viewer, org:editor,
// org:admin, org:owner.
const ROLE_RANK: Record<string, number> = {
  "org:viewer": 0,
  "org:editor": 1,
  "org:admin": 2,
  "org:owner": 3
};

// A typed error (not a raw Response) so route handlers can catch it and
// return a proper NextResponse — throwing a Response directly doesn't
// get handled the way you'd expect in Next.js route handlers.
export class RbacError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requireRole(minRole: keyof typeof ROLE_RANK) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    throw new RbacError("Not signed in to an organization", 401);
  }

  const currentRank = ROLE_RANK[orgRole ?? ""] ?? -1;
  const requiredRank = ROLE_RANK[minRole];

  if (currentRank < requiredRank) {
    throw new RbacError("Insufficient permissions for this action", 403);
  }

  return { userId, orgId, orgRole };
}

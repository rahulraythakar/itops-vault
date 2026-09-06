import { auth } from "@clerk/nextjs/server";

const ROLE_RANK: Record<string, number> = {
  "org:viewer": 0,
  "org:editor": 1,
  "org:admin": 2,
  "org:owner": 3
};

export async function requireRole(minRole: keyof typeof ROLE_RANK) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    throw new Response("Not signed in to an organization", { status: 401 });
  }

  const currentRank = ROLE_RANK[orgRole ?? ""] ?? -1;
  const requiredRank = ROLE_RANK[minRole];

  if (currentRank < requiredRank) {
    throw new Response("Insufficient permissions for this action", {
      status: 403
    });
  }

  return { userId, orgId, orgRole };
}

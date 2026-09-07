import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/encryption";
import { logAudit } from "@/lib/audit";
import { requireRole, RbacError } from "@/lib/rbac";

// POST (not GET, deliberately — this performs an action worth logging,
// not a passive read) — decrypts and returns the password for exactly
// one item, only when the user explicitly clicks Copy. Every call here
// is audit-logged as a COPY event, per the PRD's "who copied what and
// when" requirement.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId, userId } = await requireRole("org:viewer");

    const item = await prisma.vaultItem.findFirst({
      where: { id: params.id, organizationId: orgId }
    });
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const password = decryptSecret(item.encryptedPassword, item.encryptionIv);

    await logAudit({
      organizationId: orgId,
      userId,
      action: "COPY",
      itemType: "vault",
      itemId: item.id
    });

    return NextResponse.json({ password });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to reveal password" }, { status: 500 });
  }
}

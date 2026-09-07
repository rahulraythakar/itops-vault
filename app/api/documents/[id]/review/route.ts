import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRole, RbacError } from "@/lib/rbac";

// POST — marks a document as reviewed right now, resetting the
// "documentation freshness" clock. No content change, so no new version.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId, userId } = await requireRole("org:editor");

    const existing = await prisma.document.findFirst({
      where: { id: params.id, organizationId: orgId }
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const document = await prisma.document.update({
      where: { id: params.id },
      data: { lastReviewedAt: new Date() }
    });

    await logAudit({
      organizationId: orgId,
      userId,
      action: "EDIT",
      itemType: "doc",
      itemId: document.id
    });

    return NextResponse.json({ document });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to mark as reviewed" }, { status: 500 });
  }
}

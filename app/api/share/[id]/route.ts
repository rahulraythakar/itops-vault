import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, RbacError } from "@/lib/rbac";

// DELETE: revoke a share link early, before it naturally expires.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId } = await requireRole("org:editor");

    const existing = await prisma.share.findFirst({
      where: { id: params.id, organizationId: orgId }
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.share.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to revoke share" }, { status: 500 });
  }
}

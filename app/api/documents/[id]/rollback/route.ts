import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRole, RbacError } from "@/lib/rbac";

// POST { versionId } — restores an old version's content as the current
// content. This itself creates a NEW version entry (rather than deleting
// anything), so the rollback is itself part of the history and can be
// undone the same way if needed.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId, userId } = await requireRole("org:editor");
    const { versionId } = await req.json();

    const document = await prisma.document.findFirst({
      where: { id: params.id, organizationId: orgId }
    });
    if (!document) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const version = await prisma.documentVersion.findFirst({
      where: { id: versionId, documentId: params.id }
    });
    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const updated = await prisma.document.update({
      where: { id: params.id },
      data: {
        content: version.content,
        updatedAt: new Date(),
        versions: { create: { content: version.content, editedBy: userId } }
      }
    });

    await logAudit({
      organizationId: orgId,
      userId,
      action: "EDIT",
      itemType: "doc",
      itemId: document.id
    });

    return NextResponse.json({ document: updated });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to roll back" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRole, RbacError } from "@/lib/rbac";

// GET: a single document plus its full version history, newest first.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId, userId } = await requireRole("org:viewer");

    const document = await prisma.document.findFirst({
      where: { id: params.id, organizationId: orgId },
      include: { versions: { orderBy: { createdAt: "desc" } } }
    });
    if (!document) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await logAudit({
      organizationId: orgId,
      userId,
      action: "VIEW",
      itemType: "doc",
      itemId: document.id
    });

    return NextResponse.json({ document });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load document" }, { status: 500 });
  }
}

// PATCH: edit title/type/content. Every content change also writes a new
// DocumentVersion row — that's what makes rollback possible later.
export async function PATCH(
  req: Request,
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

    const body = await req.json();
    const contentChanged = typeof body.content === "string" && body.content !== existing.content;

    const document = await prisma.document.update({
      where: { id: params.id },
      data: {
        title: body.title ?? existing.title,
        docType: body.docType ?? existing.docType,
        folderId: body.folderId !== undefined ? body.folderId : existing.folderId,
        content: body.content ?? existing.content,
        updatedAt: new Date(),
        ...(contentChanged && {
          versions: { create: { content: body.content, editedBy: userId } }
        })
      }
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
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

// DELETE: same higher bar as the vault — Admin role or above, since
// deleting a doc also cascades to delete its whole version history.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId, userId } = await requireRole("org:admin");

    const existing = await prisma.document.findFirst({
      where: { id: params.id, organizationId: orgId }
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.document.delete({ where: { id: params.id } });

    await logAudit({
      organizationId: orgId,
      userId,
      action: "DELETE",
      itemType: "doc",
      itemId: params.id
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}

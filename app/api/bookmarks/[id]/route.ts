import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRole, RbacError } from "@/lib/rbac";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId, userId } = await requireRole("org:editor");

    const existing = await prisma.bookmark.findFirst({
      where: { id: params.id, organizationId: orgId }
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const item = await prisma.bookmark.update({
      where: { id: params.id },
      data: {
        title: body.title ?? existing.title,
        url: body.url ?? existing.url,
        faviconUrl: body.faviconUrl ?? existing.faviconUrl,
        tags: Array.isArray(body.tags) ? body.tags : existing.tags
      }
    });

    await logAudit({
      organizationId: orgId,
      userId,
      action: "EDIT",
      itemType: "bookmark",
      itemId: item.id
    });

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to update bookmark" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId, userId } = await requireRole("org:editor");

    const existing = await prisma.bookmark.findFirst({
      where: { id: params.id, organizationId: orgId }
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.bookmark.delete({ where: { id: params.id } });

    await logAudit({
      organizationId: orgId,
      userId,
      action: "DELETE",
      itemType: "bookmark",
      itemId: params.id
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to delete bookmark" }, { status: 500 });
  }
}

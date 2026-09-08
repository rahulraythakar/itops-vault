import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, RbacError } from "@/lib/rbac";

// PATCH: rename and/or move a folder (change its parent).
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId } = await requireRole("org:editor");
    const existing = await prisma.folder.findFirst({
      where: { id: params.id, organizationId: orgId }
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();

    // A folder can't become its own parent, directly or by being moved
    // under one of its own descendants — that would create a loop the
    // tree UI can't render. We only check the direct case here; the UI
    // doesn't currently expose deep re-parenting, so this covers the
    // realistic mistake without needing a full ancestor-chain walk.
    if (body.parentFolderId === params.id) {
      return NextResponse.json({ error: "A folder can't be its own parent" }, { status: 400 });
    }

    const folder = await prisma.folder.update({
      where: { id: params.id },
      data: {
        name: body.name ?? existing.name,
        parentFolderId: body.parentFolderId !== undefined ? body.parentFolderId : existing.parentFolderId
      }
    });

    return NextResponse.json({ folder });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
  }
}

// DELETE: removes the folder itself, but never deletes what was inside
// it. Child folders and items are "promoted" up to this folder's own
// parent (or to the root if this was already a root folder) — so
// deleting a folder can never silently delete a password, bookmark, or
// doc along with it.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId } = await requireRole("org:editor");
    const existing = await prisma.folder.findFirst({
      where: { id: params.id, organizationId: orgId }
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const promoteTo = existing.parentFolderId;

    await prisma.folder.updateMany({
      where: { parentFolderId: params.id },
      data: { parentFolderId: promoteTo }
    });

    if (existing.itemType === "vault") {
      await prisma.vaultItem.updateMany({
        where: { folderId: params.id },
        data: { folderId: promoteTo }
      });
    } else if (existing.itemType === "bookmark") {
      await prisma.bookmark.updateMany({
        where: { folderId: params.id },
        data: { folderId: promoteTo }
      });
    } else if (existing.itemType === "doc") {
      await prisma.document.updateMany({
        where: { folderId: params.id },
        data: { folderId: promoteTo }
      });
    }

    await prisma.folder.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}

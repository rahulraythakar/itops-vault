import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/encryption";
import { logAudit } from "@/lib/audit";
import { requireRole, RbacError } from "@/lib/rbac";

// PATCH: edit an existing vault item. Requires Editor role or above.
// If "password" is omitted from the request, the existing encrypted
// password is left untouched — the edit form only sends a new password
// when the user actually typed one.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId, userId } = await requireRole("org:editor");

    // Confirm the item belongs to this org before touching it — never
    // trust the id alone, or one org could edit another org's secrets.
    const existing = await prisma.vaultItem.findFirst({
      where: { id: params.id, organizationId: orgId }
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {
      title: body.title ?? existing.title,
      username: body.username ?? existing.username,
      url: body.url ?? existing.url,
      notes: body.notes ?? existing.notes,
      tags: Array.isArray(body.tags) ? body.tags : existing.tags,
      folderId: body.folderId !== undefined ? body.folderId : existing.folderId,
      updatedAt: new Date()
    };

    if (body.password) {
      const { ciphertext, iv } = encryptSecret(body.password);
      data.encryptedPassword = ciphertext;
      data.encryptionIv = iv;
    }

    const item = await prisma.vaultItem.update({
      where: { id: params.id },
      data,
      select: { id: true, title: true, username: true, url: true, tags: true, folderId: true, updatedAt: true }
    });

    await logAudit({
      organizationId: orgId,
      userId,
      action: "EDIT",
      itemType: "vault",
      itemId: item.id
    });

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to update vault item" }, { status: 500 });
  }
}

// DELETE: requires Admin role or above — a stricter bar than editing,
// since deletion is unrecoverable.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId, userId } = await requireRole("org:admin");

    const existing = await prisma.vaultItem.findFirst({
      where: { id: params.id, organizationId: orgId }
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.vaultItem.delete({ where: { id: params.id } });

    await logAudit({
      organizationId: orgId,
      userId,
      action: "DELETE",
      itemType: "vault",
      itemId: params.id
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to delete vault item" }, { status: 500 });
  }
}

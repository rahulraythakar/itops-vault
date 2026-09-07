import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/encryption";
import { logAudit } from "@/lib/audit";
import { requireRole, RbacError } from "@/lib/rbac";

// GET: list vault items for the signed-in user's org. Never includes the
// decrypted password — only metadata. Passwords are only ever decrypted
// by the separate /reveal endpoint, on an explicit user action.
export async function GET() {
  try {
    const { orgId } = await requireRole("org:viewer");

    const items = await prisma.vaultItem.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        title: true,
        username: true,
        url: true,
        tags: true,
        updatedAt: true
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load vault items" }, { status: 500 });
  }
}

// POST: create a new vault item. Requires Editor role or above.
export async function POST(req: Request) {
  try {
    const { orgId, userId } = await requireRole("org:editor");
    const body = await req.json();

    if (!body.title || !body.password) {
      return NextResponse.json(
        { error: "Title and password are required" },
        { status: 400 }
      );
    }

    const { ciphertext, iv } = encryptSecret(body.password);

    const item = await prisma.vaultItem.create({
      data: {
        organizationId: orgId,
        title: body.title,
        username: body.username || null,
        encryptedPassword: ciphertext,
        encryptionIv: iv,
        url: body.url || null,
        notes: body.notes || null,
        tags: Array.isArray(body.tags) ? body.tags : [],
        createdBy: userId,
        updatedAt: new Date()
      },
      select: { id: true, title: true, username: true, url: true, tags: true, updatedAt: true }
    });

    await logAudit({
      organizationId: orgId,
      userId,
      action: "CREATE",
      itemType: "vault",
      itemId: item.id
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to create vault item" }, { status: 500 });
  }
}

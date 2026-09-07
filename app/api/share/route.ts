import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRole, RbacError } from "@/lib/rbac";

const VALID_TYPES = ["vault", "bookmark", "doc"];

// GET: list every share link created for this org (used by the Shared
// Links management page to show what's active/expired/revoked-able).
export async function GET() {
  try {
    const { orgId } = await requireRole("org:viewer");
    const shares = await prisma.share.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ shares });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load share links" }, { status: 500 });
  }
}

// POST: create a share link for a Vault item, Bookmark, or Doc. Requires
// Editor role — sharing (especially a password) is a meaningful action,
// not something a Viewer should be able to trigger.
export async function POST(req: Request) {
  try {
    const { orgId, userId } = await requireRole("org:editor");
    const body = await req.json();
    const { itemType, itemId, expiresInHours, isOneTimeView } = body;

    if (!VALID_TYPES.includes(itemType) || !itemId) {
      return NextResponse.json({ error: "Invalid item" }, { status: 400 });
    }

    // Confirm the item actually belongs to this org before creating a
    // link for it — never trust a client-supplied id blindly.
    const exists =
      itemType === "vault"
        ? await prisma.vaultItem.findFirst({ where: { id: itemId, organizationId: orgId } })
        : itemType === "bookmark"
        ? await prisma.bookmark.findFirst({ where: { id: itemId, organizationId: orgId } })
        : await prisma.document.findFirst({ where: { id: itemId, organizationId: orgId } });

    if (!exists) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const hours = Number(expiresInHours) || 24;
    const token = crypto.randomBytes(24).toString("base64url");

    const share = await prisma.share.create({
      data: {
        organizationId: orgId,
        itemType,
        itemId,
        token,
        expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
        isOneTimeView: Boolean(isOneTimeView),
        createdBy: userId
      }
    });

    await logAudit({
      organizationId: orgId,
      userId,
      action: "SHARE",
      itemType,
      itemId
    });

    return NextResponse.json({ share }, { status: 201 });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}

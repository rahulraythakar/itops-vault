import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/encryption";
import { logAudit } from "@/lib/audit";

// GET — deliberately NOT behind requireRole/Clerk auth. This is the one
// endpoint in the whole app meant to be reachable by someone with no
// account at all, as long as they have the exact token. Everything it
// checks (expiry, one-time-view) has to be enforced right here, since
// there's no role system protecting it.
export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const share = await prisma.share.findUnique({ where: { token: params.token } });

  if (!share) {
    return NextResponse.json({ error: "This link is invalid." }, { status: 404 });
  }
  if (share.expiresAt < new Date()) {
    return NextResponse.json({ error: "This link has expired." }, { status: 410 });
  }
  if (share.isOneTimeView && share.viewedAt) {
    return NextResponse.json({ error: "This link has already been viewed once and can't be reopened." }, { status: 410 });
  }

  let payload: { title: string; content: Record<string, unknown> } | null = null;

  if (share.itemType === "vault") {
    const item = await prisma.vaultItem.findUnique({ where: { id: share.itemId } });
    if (item) {
      payload = {
        title: item.title,
        content: {
          username: item.username,
          password: decryptSecret(item.encryptedPassword, item.encryptionIv),
          url: item.url,
          notes: item.notes
        }
      };
    }
  } else if (share.itemType === "bookmark") {
    const item = await prisma.bookmark.findUnique({ where: { id: share.itemId } });
    if (item) payload = { title: item.title, content: { url: item.url } };
  } else if (share.itemType === "doc") {
    const item = await prisma.document.findUnique({ where: { id: share.itemId } });
    if (item) payload = { title: item.title, content: { markdown: item.content } };
  }

  if (!payload) {
    return NextResponse.json({ error: "The shared item no longer exists." }, { status: 410 });
  }

  // Consume the one-time view AFTER successfully building the response,
  // not before — so a mid-request failure doesn't burn the view for
  // nothing.
  if (share.isOneTimeView) {
    await prisma.share.update({ where: { id: share.id }, data: { viewedAt: new Date() } });
  }

  await logAudit({
    organizationId: share.organizationId,
    userId: "external-share-link",
    action: "VIEW",
    itemType: share.itemType,
    itemId: share.itemId
  });

  return NextResponse.json({
    itemType: share.itemType,
    title: payload.title,
    content: payload.content,
    isOneTimeView: share.isOneTimeView
  });
}

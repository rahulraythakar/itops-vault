import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRole, RbacError } from "@/lib/rbac";

export async function GET() {
  try {
    const { orgId } = await requireRole("org:viewer");
    const items = await prisma.bookmark.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load bookmarks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { orgId, userId } = await requireRole("org:editor");
    const body = await req.json();

    if (!body.url || !body.title) {
      return NextResponse.json({ error: "URL and title are required" }, { status: 400 });
    }

    const item = await prisma.bookmark.create({
      data: {
        organizationId: orgId,
        title: body.title,
        url: body.url,
        faviconUrl: body.faviconUrl || null,
        tags: Array.isArray(body.tags) ? body.tags : [],
        createdBy: userId
      }
    });

    await logAudit({
      organizationId: orgId,
      userId,
      action: "CREATE",
      itemType: "bookmark",
      itemId: item.id
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to create bookmark" }, { status: 500 });
  }
}

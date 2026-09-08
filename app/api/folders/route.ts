import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, RbacError } from "@/lib/rbac";

const VALID_TYPES = ["vault", "bookmark", "doc"];

// GET ?itemType=vault|bookmark|doc — each module has its own separate
// folder tree, so folders are always scoped by itemType, not shared
// across Vault/Bookmarks/Docs.
export async function GET(req: Request) {
  try {
    const { orgId } = await requireRole("org:viewer");
    const itemType = new URL(req.url).searchParams.get("itemType");

    if (!itemType || !VALID_TYPES.includes(itemType)) {
      return NextResponse.json({ error: "Invalid itemType" }, { status: 400 });
    }

    const folders = await prisma.folder.findMany({
      where: { organizationId: orgId, itemType },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ folders });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load folders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { orgId } = await requireRole("org:editor");
    const body = await req.json();

    if (!body.name || !VALID_TYPES.includes(body.itemType)) {
      return NextResponse.json({ error: "Name and a valid itemType are required" }, { status: 400 });
    }

    // If a parent is given, confirm it actually belongs to this org and
    // this same itemType — never let a folder end up nested under a
    // folder from a different module or a different org.
    if (body.parentFolderId) {
      const parent = await prisma.folder.findFirst({
        where: { id: body.parentFolderId, organizationId: orgId, itemType: body.itemType }
      });
      if (!parent) {
        return NextResponse.json({ error: "Parent folder not found" }, { status: 404 });
      }
    }

    const folder = await prisma.folder.create({
      data: {
        organizationId: orgId,
        name: body.name,
        itemType: body.itemType,
        parentFolderId: body.parentFolderId || null
      }
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}

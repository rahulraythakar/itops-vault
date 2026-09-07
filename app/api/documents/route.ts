import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRole, RbacError } from "@/lib/rbac";

// GET: list documents (metadata only, no content — keeps the list fast
// even as docs grow long).
export async function GET() {
  try {
    const { orgId } = await requireRole("org:viewer");
    const items = await prisma.document.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        title: true,
        docType: true,
        lastReviewedAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: "desc" }
    });
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}

// POST: create a new document. Also creates the first DocumentVersion
// entry, so version history starts from day one, not from the first edit.
export async function POST(req: Request) {
  try {
    const { orgId, userId } = await requireRole("org:editor");
    const body = await req.json();

    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const initialContent = body.content || `# ${body.title}\n\n`;

    const document = await prisma.document.create({
      data: {
        organizationId: orgId,
        title: body.title,
        docType: body.docType || "DOC",
        content: initialContent,
        createdBy: userId,
        updatedAt: new Date(),
        versions: {
          create: { content: initialContent, editedBy: userId }
        }
      }
    });

    await logAudit({
      organizationId: orgId,
      userId,
      action: "CREATE",
      itemType: "doc",
      itemId: document.id
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}

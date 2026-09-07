import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, RbacError } from "@/lib/rbac";

// GET /api/search?q=... — searches across Vault, Bookmarks, and Docs in
// one request. Deliberately does NOT decrypt or search vault passwords —
// only metadata (title, username, url, tags) is searchable. Decrypting
// every vault row just to run a text search would be both slow and a
// security smell (mass-decrypting on every keystroke).
export async function GET(req: Request) {
  try {
    const { orgId } = await requireRole("org:viewer");
    const q = new URL(req.url).searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const insensitive = { contains: q, mode: "insensitive" as const };

    const [vaultItems, bookmarks, docs] = await Promise.all([
      prisma.vaultItem.findMany({
        where: {
          organizationId: orgId,
          OR: [{ title: insensitive }, { username: insensitive }, { url: insensitive }]
        },
        select: { id: true, title: true, username: true, url: true, updatedAt: true },
        take: 10
      }),
      prisma.bookmark.findMany({
        where: {
          organizationId: orgId,
          OR: [{ title: insensitive }, { url: insensitive }]
        },
        select: { id: true, title: true, url: true, createdAt: true },
        take: 10
      }),
      prisma.document.findMany({
        where: {
          organizationId: orgId,
          OR: [{ title: insensitive }, { content: insensitive }]
        },
        select: { id: true, title: true, docType: true, content: true, updatedAt: true },
        take: 10
      })
    ]);

    const results = [
      ...vaultItems.map((v) => ({
        type: "vault" as const,
        id: v.id,
        title: v.title,
        snippet: v.username || v.url || "",
        updatedAt: v.updatedAt
      })),
      ...bookmarks.map((b) => ({
        type: "bookmark" as const,
        id: b.id,
        title: b.title,
        snippet: b.url,
        updatedAt: b.createdAt
      })),
      ...docs.map((d) => {
        // Pull a short snippet of content around the match, so a doc hit
        // shows *why* it matched instead of just its title.
        const idx = d.content.toLowerCase().indexOf(q.toLowerCase());
        const snippet =
          idx >= 0
            ? "…" + d.content.slice(Math.max(0, idx - 30), idx + 60) + "…"
            : d.content.slice(0, 90);
        return {
          type: "doc" as const,
          id: d.id,
          title: d.title,
          snippet,
          updatedAt: d.updatedAt
        };
      })
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

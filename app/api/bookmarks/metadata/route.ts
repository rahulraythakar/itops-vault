import { NextResponse } from "next/server";
import { requireRole, RbacError } from "@/lib/rbac";

// POST { url } -> { title, faviconUrl }. Fetches the target page server-side
// (browsers block this kind of cross-origin fetch, so it has to happen here)
// and pulls out <title> and a favicon link with simple regex — no HTML
// parser dependency needed for something this small. Falls back gracefully
// if the site can't be reached or has no obvious title/favicon.
export async function POST(req: Request) {
  try {
    await requireRole("org:viewer");
    const { url } = await req.json();

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    let title = parsed.hostname;
    let faviconUrl = `${parsed.origin}/favicon.ico`;

    try {
      const res = await fetch(parsed.toString(), {
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ITOpsVaultBot/1.0)" }
      });
      const html = await res.text();

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) title = titleMatch[1].trim();

      const iconMatch = html.match(
        /<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']+)["']/i
      );
      if (iconMatch) {
        faviconUrl = new URL(iconMatch[1], parsed.origin).toString();
      }
    } catch {
      // Site unreachable or blocked our fetch — the hostname/favicon.ico
      // fallbacks set above are good enough; the user can edit either
      // field manually before saving.
    }

    return NextResponse.json({ title, faviconUrl });
  } catch (error) {
    if (error instanceof RbacError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 });
  }
}

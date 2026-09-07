import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Temporary diagnostic route for Step 2.5 — confirms Vercel can actually
// reach the Neon database at runtime, not just that the schema was pushed
// successfully from Neon's own SQL Editor. Safe to delete once Step 3
// (the real vault) is underway, since its own writes will prove this.
export async function GET() {
  try {
    const auditLogCount = await prisma.auditLog.count();
    return NextResponse.json({ ok: true, auditLogCount });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

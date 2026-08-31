import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";

// Every sensitive read/write should call this. Kept as one tiny function
// so it's impossible to forget the org/user/ip fields.
export async function logAudit(params: {
  organizationId: string;
  userId: string;
  action: AuditAction;
  itemType: string;
  itemId: string;
  ipAddress?: string;
}) {
  await prisma.auditLog.create({ data: params });
}

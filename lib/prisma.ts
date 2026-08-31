import { PrismaClient } from "@prisma/client";

// Standard Next.js pattern: reuse one Prisma instance across hot reloads
// in dev so we don't exhaust the DB connection pool.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

import { PrismaClient } from "@prisma/client";

// Avoid creating a new PrismaClient on every hot-reload in dev / every
// serverless invocation edge-case in prod.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}


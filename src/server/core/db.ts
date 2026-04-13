import { PrismaClient } from "@prisma/client";
//import "server-only";

const globalForPrisma = globalThis as typeof globalThis & {
  cachedPrisma?: PrismaClient;
};

const prisma =
  globalForPrisma.cachedPrisma ??
  new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.cachedPrisma = prisma;
}

export { prisma };

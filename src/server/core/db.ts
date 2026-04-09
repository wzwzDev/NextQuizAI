import { PrismaClient } from "@prisma/client";
//import "server-only";

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

const prisma =
  process.env.NODE_ENV === "production"
    ? new PrismaClient()
    : global.cachedPrisma || (global.cachedPrisma = new PrismaClient());

export { prisma };

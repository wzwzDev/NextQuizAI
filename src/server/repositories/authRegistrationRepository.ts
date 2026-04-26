import { prisma } from "@/server/core/db";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function createUserWithPassword(params: {
  email: string;
  name: string | null;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      email: params.email,
      name: params.name,
      passwordHash: params.passwordHash,
      emailVerified: null,
    },
  });
}

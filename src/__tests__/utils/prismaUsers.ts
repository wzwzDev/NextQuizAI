import type { PrismaClient, User } from "@prisma/client";

export type TestUserInput = {
  email: string;
  name?: string | null;
  passwordHash?: string | null;
  banned?: boolean;
  revoked?: boolean;
  isAdmin?: boolean;
  isOnline?: boolean;
  emailVerified?: Date | null;
  image?: string | null;
};

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
}

export async function createTestUser(
  prisma: PrismaClient,
  input: TestUserInput,
): Promise<User> {
  return prisma.user.create({
    data: {
      name: input.name ?? null,
      email: input.email,
      passwordHash: input.passwordHash ?? null,
      banned: input.banned ?? false,
      revoked: input.revoked ?? false,
      isAdmin: input.isAdmin ?? false,
      isOnline: input.isOnline ?? false,
      emailVerified: input.emailVerified ?? null,
      image: input.image ?? null,
    },
  });
}

export async function cleanupUsersByEmail(prisma: PrismaClient, emails: string[]) {
  const uniqueEmails = Array.from(
    new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean)),
  );

  if (uniqueEmails.length === 0) {
    return;
  }

  await prisma.emailVerificationToken.deleteMany({
    where: { email: { in: uniqueEmails } },
  });

  await prisma.user.deleteMany({
    where: { email: { in: uniqueEmails } },
  });
}

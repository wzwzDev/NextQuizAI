import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/server/core/db";
import { normalizeEmail } from "@/server/auth/password";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createEmailVerificationToken(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.emailVerificationToken.deleteMany({
    where: {
      email: normalizedEmail,
      consumedAt: null,
    },
  });

  await prisma.emailVerificationToken.create({
    data: {
      email: normalizedEmail,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token);
  const now = new Date();

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.consumedAt || record.expiresAt < now) {
    return { ok: false as const };
  }

  const user = await prisma.user.findUnique({
    where: { email: record.email },
  });

  if (!user) {
    return { ok: false as const };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: now },
    }),
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { consumedAt: now },
    }),
  ]);

  return { ok: true as const, email: record.email };
}

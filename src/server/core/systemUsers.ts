import { prisma } from "@/server/core/db";
import { getAdminCredentialsConfig, getOwnerEmail } from "@/server/core/roles";

let ensurePromise: Promise<void> | null = null;

async function ensureSystemUsersOnce() {
  const ownerEmail = getOwnerEmail();
  const adminConfig = getAdminCredentialsConfig();

  if (ownerEmail) {
    await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {
        name: "Owner",
        isAdmin: true,
        banned: false,
        revoked: false,
      },
      create: {
        email: ownerEmail,
        name: "Owner",
        isAdmin: true,
        banned: false,
        revoked: false,
      },
    });
  }

  if (adminConfig.loginEmail && adminConfig.loginEmail !== ownerEmail) {
    await prisma.user.upsert({
      where: { email: adminConfig.loginEmail },
      update: {
        name: adminConfig.displayName,
        isAdmin: true,
        banned: false,
        revoked: false,
      },
      create: {
        email: adminConfig.loginEmail,
        name: adminConfig.displayName,
        isAdmin: true,
        banned: false,
        revoked: false,
      },
    });
  }
}

export function ensureSystemUsers() {
  if (!ensurePromise) {
    ensurePromise = ensureSystemUsersOnce().finally(() => {
      ensurePromise = null;
    });
  }

  return ensurePromise;
}

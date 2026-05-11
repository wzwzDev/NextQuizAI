const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  const ownerEmail = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
  const adminEmail = (process.env.ADMIN_LOGIN_EMAIL || "").trim().toLowerCase();

  if (!ownerEmail || !adminEmail) {
    throw new Error("OWNER_EMAIL and ADMIN_LOGIN_EMAIL must be set in .env.local");
  }

  const keepEmails = Array.from(new Set([ownerEmail, adminEmail]));

  await prisma.emailVerificationToken.deleteMany({
    where: {
      email: {
        notIn: keepEmails,
      },
    },
  });

  const deleted = await prisma.user.deleteMany({
    where: {
      email: {
        notIn: keepEmails,
      },
    },
  });

  console.log(`Deleted ${deleted.count} non-system users.`);

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

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: process.env.ADMIN_DISPLAY_NAME || "Admin Account",
      isAdmin: true,
      banned: false,
      revoked: false,
    },
    create: {
      email: adminEmail,
      name: process.env.ADMIN_DISPLAY_NAME || "Admin Account",
      isAdmin: true,
      banned: false,
      revoked: false,
    },
  });

  console.log("Owner/admin accounts ensured.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

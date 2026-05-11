import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const ownerEmail = 'waelwzwz@gmail.com';
  const adminEmail = 'tutormiw@gmail.com';

  console.log('Upserting owner:', ownerEmail);
  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      name: 'Owner',
      banned: false,
      revoked: false,
      isAdmin: false,
    },
    create: {
      email: ownerEmail,
      name: 'Owner',
      passwordHash: null,
      banned: false,
      revoked: false,
      isAdmin: false,
    },
  });
  console.log('Owner upserted id=', owner.id);

  console.log('Upserting admin:', adminEmail);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Admin Account',
      banned: false,
      revoked: false,
      isAdmin: true,
    },
    create: {
      email: adminEmail,
      name: 'Admin Account',
      passwordHash: null,
      banned: false,
      revoked: false,
      isAdmin: true,
    },
  });
  console.log('Admin upserted id=', admin.id);
}

main()
  .catch((e) => {
    console.error('Error running restore script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

void (async () => {
  const { PrismaClient } = await import('@prisma/client');
  const { randomBytes, scryptSync } = await import('crypto');

  const prisma = new PrismaClient();

  const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
  const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234';
  const DEFAULT_OWNER_EMAIL = process.env.OWNER_EMAIL || 'waelwzwz@gmail.com';
  const DEFAULT_OWNER_PASSWORD = process.env.OWNER_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const KEY_LENGTH = 64;

  function hashPasswordSync(password) {
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(password, salt, KEY_LENGTH);
    return `${salt}:${derived.toString('hex')}`;
  }

  async function upsertAdmin() {
    const existing = await prisma.user.findUnique({ where: { email: DEFAULT_ADMIN_EMAIL } });
    const passwordHash = hashPasswordSync(DEFAULT_ADMIN_PASSWORD);

    if (!existing) {
      await prisma.user.create({
        data: {
          email: DEFAULT_ADMIN_EMAIL,
          name: 'Admin',
          isAdmin: true,
          banned: false,
          revoked: false,
          passwordHash,
        },
      });
      console.log(`Created admin user: ${DEFAULT_ADMIN_EMAIL} (password: ${DEFAULT_ADMIN_PASSWORD})`);
    } else {
      await prisma.user.update({
        where: { email: DEFAULT_ADMIN_EMAIL },
        data: { isAdmin: true, passwordHash },
      });
      console.log(`Updated admin user: ${DEFAULT_ADMIN_EMAIL} (password: ${DEFAULT_ADMIN_PASSWORD})`);
    }
  }

  async function upsertOwner() {
    const ownerEmail = DEFAULT_OWNER_EMAIL;
    const ownerPasswordHash = hashPasswordSync(DEFAULT_OWNER_PASSWORD);

    const existing = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: ownerEmail,
          name: 'Owner',
          isAdmin: true,
          banned: false,
          revoked: false,
          passwordHash: ownerPasswordHash,
        },
      });
      console.log(`Created owner user: ${ownerEmail} (password: ${DEFAULT_OWNER_PASSWORD})`);
    } else {
      await prisma.user.update({
        where: { email: ownerEmail },
        data: { isAdmin: true, passwordHash: ownerPasswordHash },
      });
      console.log(`Updated owner user: ${ownerEmail} (password: ${DEFAULT_OWNER_PASSWORD})`);
    }
  }

  async function ensureSampleQuiz() {
    const quizCount = await prisma.adminQuiz.count();
    if (quizCount === 0) {
      await prisma.adminQuiz.create({
        data: {
          title: 'Sample Quiz',
          category: 'General',
          difficulty: 'easy',
          quizType: 'mcq',
          status: 'approved',
          questions: {
            create: [
              {
                question: 'What is the capital of France?',
                answer: 'Paris',
                options: ['Paris', 'Berlin', 'Rome', 'Madrid'],
              },
            ],
          },
        },
      });
      console.log('Created sample admin quiz.');
    } else {
      console.log('Admin quizzes already present, skipping sample quiz.');
    }
  }

  try {
    console.log('Seeding minimal data...');
    await upsertOwner();
    await upsertAdmin();
    await ensureSampleQuiz();
    console.log('Seeding complete.');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();

void (async () => {
  const { PrismaClient } = await import('@prisma/client');

  const prisma = new PrismaClient();

  const DEFAULT_OWNER_EMAIL = (process.env.OWNER_EMAIL || 'waelwzwz@gmail.com').trim().toLowerCase();
  const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_LOGIN_EMAIL || 'tutormiw@gmail.com').trim().toLowerCase();

  async function upsertUser({ email, name }) {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          name,
          isAdmin: true,
          banned: false,
          revoked: false,
        },
      });
      console.log(`Created user: ${email}`);
      return;
    }

    await prisma.user.update({
      where: { email },
      data: {
        name,
        isAdmin: true,
        banned: false,
        revoked: false,
      },
    });
    console.log(`Updated user: ${email}`);
  }

  async function upsertAdmin() {
    await upsertUser({ email: DEFAULT_ADMIN_EMAIL, name: process.env.ADMIN_DISPLAY_NAME || 'Admin Account' });
  }

  async function upsertOwner() {
    await upsertUser({ email: DEFAULT_OWNER_EMAIL, name: 'Owner' });
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

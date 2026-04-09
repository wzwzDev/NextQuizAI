import { prisma } from "@/server/core/db";

export type CreateAdminQuizInput = {
  title: string;
  category: string;
  difficulty: string;
  status?: string;
  questions: Array<{ question: string; answer: string }>;
};

export async function createAdminQuiz(input: CreateAdminQuizInput) {
  return prisma.adminQuiz.create({
    data: {
      title: input.title,
      category: input.category,
      difficulty: input.difficulty,
      status: input.status ?? "approved",
      questions: {
        create: input.questions,
      },
    },
    include: { questions: true },
  });
}

export async function findAdminQuizzes(filter?: {
  category?: string;
  difficulty?: string;
}) {
  const where: { category?: string; difficulty?: string } = {};
  if (filter?.category) where.category = filter.category;
  if (filter?.difficulty) where.difficulty = filter.difficulty;

  return prisma.adminQuiz.findMany({
    where,
    include: { questions: true },
  });
}

export async function deleteAdminQuizById(id: string) {
  return prisma.adminQuiz.delete({
    where: { id },
  });
}

export async function findApprovedQuizById(id: string) {
  return prisma.adminQuiz.findFirst({
    where: {
      id,
      status: "approved",
    },
    include: { questions: true },
  });
}

export async function findAllUserQuizAttempts() {
  return prisma.userQuizAttempt.findMany();
}
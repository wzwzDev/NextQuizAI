import { prisma } from "@/server/core/db";
import { buildStoredQuestionMetadata } from "@/server/core/quizQuestionMetadata";

export type CreateAdminQuizInput = {
  title: string;
  category: string;
  difficulty: string;
  quizType?: "mcq" | "open_ended";
  status?: string;
  questions: Array<{
    question: string;
    answer: string;
    options?: string[];
    citation?: { source: string; snippet: string; confidence?: number };
  }>;
};

export async function createAdminQuiz(input: CreateAdminQuizInput) {
  return prisma.adminQuiz.create({
    data: {
      title: input.title,
      category: input.category,
      difficulty: input.difficulty,
      quizType: input.quizType ?? "open_ended",
      status: input.status ?? "approved",
      questions: {
        create: input.questions.map((question) => {
          const storedOptions = buildStoredQuestionMetadata({
            quizType: input.quizType ?? "open_ended",
            options: question.options,
            citation: question.citation,
          });

          return {
            question: question.question,
            answer: question.answer,
            ...(storedOptions !== undefined ? { options: storedOptions } : {}),
          };
        }),
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
    orderBy: { updatedAt: "desc" },
  });
}

export async function findApprovedQuizzesForLibrary() {
  return prisma.adminQuiz.findMany({
    where: { status: "approved" },
    select: {
      id: true,
      title: true,
      category: true,
      difficulty: true,
      quizType: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          questions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
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

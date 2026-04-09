import { prisma } from "@/server/core/db";
import { Prisma } from "@prisma/client";

export async function createUserQuizAttempt(params: {
  userId: string;
  quizId: string;
  quizTitle: string;
  answers: unknown;
  score: number;
}) {
  return prisma.userQuizAttempt.create({
    data: {
      userId: params.userId,
      quizId: params.quizId,
      quizTitle: params.quizTitle,
      answers: params.answers as Prisma.InputJsonValue,
      score: params.score,
    },
  });
}

export async function listUserQuizAttemptsByUserId(userId: string) {
  return prisma.userQuizAttempt.findMany({
    where: { userId },
  });
}
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
      status: "completed",
      completedAt: new Date(),
    },
  });
}

export async function findUserQuizAttemptByUserAndQuiz(
  userId: string,
  quizId: string,
) {
  return prisma.userQuizAttempt.findFirst({
    where: { userId, quizId },
  });
}

export async function createPendingUserQuizAttempt(params: {
  userId: string;
  quizId: string;
  quizTitle: string;
}) {
  return prisma.userQuizAttempt.create({
    data: {
      userId: params.userId,
      quizId: params.quizId,
      quizTitle: params.quizTitle,
      answers: {} as Prisma.InputJsonValue,
      score: 0,
      status: "pending",
      completedAt: null,
    },
  });
}

export async function ensurePendingUserQuizAttempt(params: {
  userId: string;
  quizId: string;
  quizTitle: string;
}) {
  const existing = await findUserQuizAttemptByUserAndQuiz(
    params.userId,
    params.quizId,
  );

  if (existing) {
    return existing;
  }

  try {
    return await createPendingUserQuizAttempt(params);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return findUserQuizAttemptByUserAndQuiz(params.userId, params.quizId);
    }

    throw error;
  }
}

export async function countCompletedUserQuizAttempts(
  userId: string,
  quizId: string,
) {
  const count = await prisma.userQuizAttempt.count({
    where: {
      userId,
      quizId,
      status: "completed",
    },
  });
  return count;
}

export async function getLastAttemptNumber(
  userId: string,
  quizId: string,
) {
  const lastAttempt = await prisma.userQuizAttempt.findFirst({
    where: {
      userId,
      quizId,
    },
    orderBy: {
      attemptNumber: "desc",
    },
    select: {
      attemptNumber: true,
    },
  });
  return lastAttempt?.attemptNumber ?? 0;
}

export async function findPendingUserQuizAttempt(
  userId: string,
  quizId: string,
) {
  return prisma.userQuizAttempt.findFirst({
    where: {
      userId,
      quizId,
      status: "pending",
    },
  });
}

export async function completePendingUserQuizAttempt(params: {
  userId: string;
  quizId: string;
  answers: unknown;
  score: number;
}) {
  const completionTimestamp = new Date();

  const updateResult = await prisma.userQuizAttempt.updateMany({
    where: {
      userId: params.userId,
      quizId: params.quizId,
      status: "pending",
    },
    data: {
      answers: params.answers as Prisma.InputJsonValue,
      score: params.score,
      status: "completed",
      completedAt: completionTimestamp,
    },
  });

  if (updateResult.count === 0) {
    return null;
  }

  return findUserQuizAttemptByUserAndQuiz(params.userId, params.quizId);
}

export async function listUserQuizAttemptsByUserId(userId: string) {
  return prisma.userQuizAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listUserQuizAttemptsByUserIdAndQuizIds(
  userId: string,
  quizIds: string[],
) {
  if (quizIds.length === 0) {
    return [];
  }

  return prisma.userQuizAttempt.findMany({
    where: {
      userId,
      quizId: { in: quizIds },
    },
  });
}

export async function listUserQuizAttemptsByQuizIds(quizIds: string[]) {
  if (quizIds.length === 0) {
    return [];
  }

  return prisma.userQuizAttempt.findMany({
    where: {
      quizId: { in: quizIds },
    },
  });
}

export async function listCompletedUserQuizAttempts() {
  return prisma.userQuizAttempt.findMany({
    where: {
      status: "completed",
    },
    orderBy: {
      completedAt: "desc",
    },
  });
}

export async function findUserQuizAttemptById(attemptId: string) {
  return prisma.userQuizAttempt.findUnique({
    where: { id: attemptId },
  });
}

export async function updateUserQuizAttemptAnswersById(params: {
  attemptId: string;
  answers: unknown;
  score?: number;
}) {
  return prisma.userQuizAttempt.update({
    where: { id: params.attemptId },
    data: {
      answers: params.answers as Prisma.InputJsonValue,
      ...(typeof params.score === "number" ? { score: params.score } : {}),
    },
  });
}
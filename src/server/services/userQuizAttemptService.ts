import {
  completePendingUserQuizAttempt,
  createUserQuizAttempt,
  ensurePendingUserQuizAttempt,
  findUserQuizAttemptByUserAndQuiz,
  listUserQuizAttemptsByUserId,
  listUserQuizAttemptsByUserIdAndQuizIds,
} from "@/server/repositories/userQuizAttemptRepository";

export class UserQuizAttemptAlreadyCompletedError extends Error {
  constructor() {
    super("You already completed this quiz.");
    this.name = "UserQuizAttemptAlreadyCompletedError";
  }
}

export class UserQuizAttemptNotStartedError extends Error {
  constructor() {
    super("Quiz attempt was not started.");
    this.name = "UserQuizAttemptNotStartedError";
  }
}

export async function saveUserQuizAttempt(params: {
  userId: string;
  quizId: string;
  quizTitle: string;
  answers: unknown;
  score: number;
}) {
  const existingAttempt = await findUserQuizAttemptByUserAndQuiz(
    params.userId,
    params.quizId,
  );

  if (existingAttempt?.status === "completed") {
    throw new UserQuizAttemptAlreadyCompletedError();
  }

  if (existingAttempt?.status === "pending") {
    const completedAttempt = await completePendingUserQuizAttempt({
      userId: params.userId,
      quizId: params.quizId,
      answers: params.answers,
      score: params.score,
    });

    if (!completedAttempt) {
      throw new UserQuizAttemptNotStartedError();
    }

    return completedAttempt;
  }

  return createUserQuizAttempt(params);
}

export async function getUserQuizAttempt(userId: string, quizId: string) {
  return findUserQuizAttemptByUserAndQuiz(userId, quizId);
}

export async function ensurePendingQuizAttempt(params: {
  userId: string;
  quizId: string;
  quizTitle: string;
}) {
  const existingAttempt = await findUserQuizAttemptByUserAndQuiz(
    params.userId,
    params.quizId,
  );

  if (existingAttempt?.status === "completed") {
    throw new UserQuizAttemptAlreadyCompletedError();
  }

  const pendingAttempt = await ensurePendingUserQuizAttempt(params);
  if (!pendingAttempt) {
    throw new UserQuizAttemptNotStartedError();
  }

  return pendingAttempt;
}

export async function completePendingQuizAttempt(params: {
  userId: string;
  quizId: string;
  answers: unknown;
  score: number;
}) {
  const existingAttempt = await findUserQuizAttemptByUserAndQuiz(
    params.userId,
    params.quizId,
  );

  if (!existingAttempt) {
    throw new UserQuizAttemptNotStartedError();
  }

  if (existingAttempt.status === "completed") {
    throw new UserQuizAttemptAlreadyCompletedError();
  }

  const completedAttempt = await completePendingUserQuizAttempt(params);
  if (!completedAttempt) {
    throw new UserQuizAttemptNotStartedError();
  }

  return completedAttempt;
}

export async function getUserQuizAttemptStatuses(
  userId: string,
  quizIds: string[],
) {
  const attempts = await listUserQuizAttemptsByUserIdAndQuizIds(userId, quizIds);

  return attempts.map((attempt) => ({
    quizId: attempt.quizId,
    status: attempt.status,
    score: attempt.score,
    startedAt: attempt.startedAt,
    completedAt: attempt.completedAt,
  }));
}

export async function getUserQuizStats(userId: string) {
  const attempts = (await listUserQuizAttemptsByUserId(userId)).filter(
    (attempt) => attempt.status === "completed",
  );

  const statsMap: Record<
    string,
    {
      id: string;
      title: string;
      attempts: number;
      totalScore: number;
      lastAttempt: Date;
    }
  > = {};

  for (const attempt of attempts) {
    if (!statsMap[attempt.quizId]) {
      statsMap[attempt.quizId] = {
        id: attempt.quizId,
        title: attempt.quizTitle,
        attempts: 0,
        totalScore: 0,
        lastAttempt: attempt.createdAt,
      };
    }
    const item = statsMap[attempt.quizId];
    item.attempts += 1;
    item.totalScore += attempt.score;
    if (attempt.createdAt > item.lastAttempt) {
      item.lastAttempt = attempt.createdAt;
    }
  }

  return Object.values(statsMap).map((stat) => ({
    id: stat.id,
    title: stat.title,
    attempts: stat.attempts,
    averageScore: stat.attempts ? stat.totalScore / stat.attempts : null,
    lastAttempt: stat.lastAttempt,
  }));
}
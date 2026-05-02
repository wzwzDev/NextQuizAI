import type { QuizAttemptRepositoryPort } from "@/application/ports/out/QuizAttemptRepositoryPort";
import {
  ensurePendingUserQuizAttempt,
  findUserQuizAttemptByUserAndQuiz,
  completePendingUserQuizAttempt,
} from "@/server/repositories/userQuizAttemptRepository";
import { UserQuizAttempt } from "@/domain/entities/UserQuizAttempt";

export class QuizAttemptRepositoryAdapter implements QuizAttemptRepositoryPort {
  async ensurePending(input: {
    userId: string;
    quizId: string;
    quizTitle: string;
  }) {
    const res = await ensurePendingUserQuizAttempt(input);
    return UserQuizAttempt.fromPrisma(res);
  }

  async findAttemptByUserAndQuiz(userId: string, quizId: string) {
    const res = await findUserQuizAttemptByUserAndQuiz(userId, quizId);
    return UserQuizAttempt.fromPrisma(res);
  }

  async completeAttempt(input: {
    userId: string;
    quizId: string;
    answers: unknown;
    score: number;
  }) {
    await completePendingUserQuizAttempt(input);
  }

  async complete(input: {
    userId: string;
    quizId: string;
    score: number;
    details: unknown;
  }) {
    await completePendingUserQuizAttempt({
      userId: input.userId,
      quizId: input.quizId,
      answers: input.details,
      score: input.score,
    });
  }
}

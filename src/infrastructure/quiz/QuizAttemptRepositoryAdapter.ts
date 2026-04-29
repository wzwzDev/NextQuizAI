import type { QuizAttemptRepositoryPort } from "@/application/ports/out/QuizAttemptRepositoryPort";
import {
  ensurePendingUserQuizAttempt,
  findUserQuizAttemptByUserAndQuiz,
  completePendingUserQuizAttempt,
} from "@/server/repositories/userQuizAttemptRepository";

export class QuizAttemptRepositoryAdapter implements QuizAttemptRepositoryPort {
  async ensurePending(input: {
    userId: string;
    quizId: string;
    quizTitle: string;
  }) {
    return ensurePendingUserQuizAttempt(input);
  }

  async findAttemptByUserAndQuiz(userId: string, quizId: string) {
    return findUserQuizAttemptByUserAndQuiz(userId, quizId);
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

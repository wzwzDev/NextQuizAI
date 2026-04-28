import type { QuizAttemptRepositoryPort } from "@/application/ports/out/QuizAttemptRepositoryPort";
import {
  ensurePendingUserQuizAttempt,
  findUserQuizAttemptByUserAndQuiz,
  completePendingUserQuizAttempt,
} from "@/server/repositories/userQuizAttemptRepository";

export class QuizAttemptRepositoryAdapter implements QuizAttemptRepositoryPort {
  async ensurePendingAttempt(params: {
    userId: string;
    quizId: string;
    quizTitle: string;
  }) {
    return ensurePendingUserQuizAttempt(params);
  }

  async findAttemptByUserAndQuiz(userId: string, quizId: string) {
    return findUserQuizAttemptByUserAndQuiz(userId, quizId);
  }

  async completeAttempt(params: {
    userId: string;
    quizId: string;
    answers: unknown;
    score: number;
  }) {
    await completePendingUserQuizAttempt(params);
  }
}

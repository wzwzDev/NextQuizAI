import type { UserQuizAttempt } from "@/domain/entities/UserQuizAttempt";

export interface QuizAttemptRepositoryPort {
  ensurePending(input: {
    userId: string;
    quizId: string;
    quizTitle: string;
  }): Promise<UserQuizAttempt | null>;

  findAttemptByUserAndQuiz(
    userId: string,
    quizId: string,
  ): Promise<UserQuizAttempt | null>;

  completeAttempt(input: {
    userId: string;
    quizId: string;
    answers: unknown;
    score: number;
  }): Promise<void>;

  complete(input: {
    userId: string;
    quizId: string;
    score: number;
    details: unknown;
  }): Promise<void>;
}

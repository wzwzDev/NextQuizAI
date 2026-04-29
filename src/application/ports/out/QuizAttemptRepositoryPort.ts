export interface QuizAttemptRepositoryPort {
  ensurePending(input: {
    userId: string;
    quizId: string;
    quizTitle: string;
  }): Promise<{ id: string; status: "pending" | "completed" }>;

  findAttemptByUserAndQuiz(
    userId: string,
    quizId: string,
  ): Promise<{ id: string; status: "pending" | "completed" } | null>;

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

export interface AdminQuizAttemptLifecyclePort {
  ensurePendingAttempt(input: {
    userId: string;
    quizId: string;
    quizTitle: string;
    allowedAttempts?: number;
  }): Promise<void>;

  completePendingAttempt(input: {
    userId: string;
    quizId: string;
    answers: unknown;
    score: number;
  }): Promise<void>;
}

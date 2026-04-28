import type { QuizAttemptRepositoryPort } from "@/application/ports/out/QuizAttemptRepositoryPort";

export class QuizAttemptNotStartedError extends Error {
  constructor() {
    super("Quiz attempt was not started.");
    this.name = "QuizAttemptNotStartedError";
  }
}

export class SubmitQuizAttemptUseCase {
  constructor(private quizAttemptRepository: QuizAttemptRepositoryPort) {}

  async execute(input: {
    userId: string;
    quizId: string;
    answers: unknown;
    score: number;
  }): Promise<void> {
    // Check that attempt was started
    const existing = await this.quizAttemptRepository.findAttemptByUserAndQuiz(
      input.userId,
      input.quizId,
    );

    if (!existing) {
      throw new QuizAttemptNotStartedError();
    }

    if (existing.status === "completed") {
      throw new Error("This quiz attempt is already completed.");
    }

    // Complete the attempt
    await this.quizAttemptRepository.completeAttempt(input);
  }
}

import type { QuizAttemptRepositoryPort } from "@/application/ports/out/QuizAttemptRepositoryPort";

export class QuizAlreadyCompletedError extends Error {
  constructor() {
    super("You already completed this quiz.");
    this.name = "QuizAlreadyCompletedError";
  }
}

export class QuizAttemptStartError extends Error {
  constructor() {
    super("Could not start quiz attempt.");
    this.name = "QuizAttemptStartError";
  }
}

export class StartQuizAttemptUseCase {
  constructor(private quizAttemptRepository: QuizAttemptRepositoryPort) {}

  async execute(input: {
    userId: string;
    quizId: string;
    quizTitle: string;
  }): Promise<{
    id: string;
    userId: string;
    quizId: string;
    status: "pending";
  }> {
    // Check if quiz attempt already completed
    const existing = await this.quizAttemptRepository.findAttemptByUserAndQuiz(
      input.userId,
      input.quizId,
    );

    if (existing?.status === "completed") {
      throw new QuizAlreadyCompletedError();
    }

    // Ensure pending attempt exists or create one
    const attempt = await this.quizAttemptRepository.ensurePendingAttempt(input);

    if (!attempt) {
      throw new QuizAttemptStartError();
    }

    return {
      id: attempt.id,
      userId: attempt.userId,
      quizId: attempt.quizId,
      status: "pending",
    };
  }
}

import type { QuizAttemptRepositoryPort } from "@/application/ports/out/QuizAttemptRepositoryPort";

export class ReviewQuizAttemptUseCase {
  constructor(private quizAttemptRepository: QuizAttemptRepositoryPort) {}

  async execute(input: {
    userId: string;
    quizId: string;
  }): Promise<{
    id: string;
    status: "pending" | "completed";
  } | null> {
    return this.quizAttemptRepository.findAttemptByUserAndQuiz(
      input.userId,
      input.quizId,
    );
  }
}

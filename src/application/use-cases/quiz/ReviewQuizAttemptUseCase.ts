import type { QuizAttemptRepositoryPort } from "@/application/ports/out/QuizAttemptRepositoryPort";
import type { UserQuizAttempt } from "@/domain/entities/UserQuizAttempt";

export class ReviewQuizAttemptUseCase {
  constructor(private quizAttemptRepository: QuizAttemptRepositoryPort) {}

  async execute(input: {
    userId: string;
    quizId: string;
  }): Promise<UserQuizAttempt | null> {
    return this.quizAttemptRepository.findAttemptByUserAndQuiz(
      input.userId,
      input.quizId,
    );
  }
}

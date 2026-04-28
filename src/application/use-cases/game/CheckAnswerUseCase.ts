import type { QuestionRepositoryPort } from "@/application/ports/out/QuestionRepositoryPort";
import type { PermissionCheckPort } from "@/application/ports/out/PermissionCheckPort";
import type { GradeOpenEndedAnswerUseCase } from "@/application/use-cases/quiz/GradeOpenEndedAnswerUseCase";

export class QuestionNotFoundError extends Error {
  constructor() {
    super("Question not found.");
    this.name = "QuestionNotFoundError";
  }
}

export class QuestionAccessForbiddenError extends Error {
  constructor() {
    super("You do not have permission to answer this question.");
    this.name = "QuestionAccessForbiddenError";
  }
}

export type CheckAnswerResult = {
  isCorrect?: boolean;
  percentageSimilar?: number;
  gradingMethod?: string;
};

export class CheckAnswerUseCase {
  constructor(
    private questionRepository: QuestionRepositoryPort,
    private permissionCheck: PermissionCheckPort,
    private gradeOpenEndedUseCase: GradeOpenEndedAnswerUseCase,
  ) {}

  async execute(input: {
    questionId: string;
    userAnswer: string;
    userId?: string;
    isAdmin?: boolean;
  }): Promise<CheckAnswerResult> {
    // Find question
    const question = await this.questionRepository.findQuestionWithGameOwnerById(
      input.questionId,
    );

    if (!question) {
      throw new QuestionNotFoundError();
    }

    // Check permissions
    if (input.userId) {
      const canAccess = this.permissionCheck.canUserAccessResource(
        input.userId,
        question.game.userId,
        input.isAdmin === true,
      );

      if (!canAccess) {
        throw new QuestionAccessForbiddenError();
      }
    }

    // Save user answer
    await this.questionRepository.saveUserAnswer(input.questionId, input.userAnswer);

    // Grade based on question type
    if (question.questionType === "mcq") {
      const isCorrect =
        question.answer.toLowerCase().trim() === input.userAnswer.toLowerCase().trim();

      await this.questionRepository.saveMcqResult(input.questionId, isCorrect);

      return { isCorrect };
    }

    if (question.questionType === "open_ended") {
      const grading = await this.gradeOpenEndedUseCase.execute(
        question.answer,
        input.userAnswer,
      );

      await this.questionRepository.saveOpenEndedResult(
        input.questionId,
        grading.percentageSimilar,
      );

      return {
        percentageSimilar: grading.percentageSimilar,
        gradingMethod: grading.gradingMethod,
      };
    }

    return {};
  }
}

import { AdminQuizRepositoryPort } from "@/application/ports/admin/AdminQuizRepositoryPort";
import { AdminQuizGradingPort } from "@/application/ports/admin/AdminQuizGradingPort";
import { AdminQuizAttemptLifecyclePort } from "@/application/ports/admin/AdminQuizAttemptLifecyclePort";
import { AdminQuizQuestionMetadataPort } from "@/application/ports/admin/AdminQuizQuestionMetadataPort";

export type AdminQuizQuestionResult = {
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  percentageSimilar: number;
  isAccepted: boolean;
  gradingMethod: "typo_tolerant" | "exact_match";
  confidence: number;
  confidenceLevel: "low" | "medium" | "high";
  decisionReason: string;
  reviewRequired: boolean;
  rawSimilarity: number;
  citation?: {
    source: string;
    snippet: string;
    confidence?: number;
  };
};

export type SubmitAdminQuizResult = {
  quizId: string;
  title: string;
  quizType: "mcq" | "open_ended";
  score: number;
  questionResults: AdminQuizQuestionResult[];
};

export class AdminQuizNotFoundError extends Error {
  constructor() {
    super("Quiz not found.");
    this.name = "AdminQuizNotFoundError";
  }
}

/**
 * Use case for submitting and grading admin quiz attempts
 * Grades all questions and stores the attempt result
 */
export class SubmitAndGradeAdminQuizUseCase {
  constructor(
    private adminQuizRepository: AdminQuizRepositoryPort,
    private adminQuizGrading: AdminQuizGradingPort,
    private quizAttemptLifecycle: AdminQuizAttemptLifecyclePort,
    private questionMetadata: AdminQuizQuestionMetadataPort,
  ) {}

  async execute(input: {
    quizId: string;
    userId: string;
    answers: string[];
  }): Promise<SubmitAdminQuizResult> {
    const quiz = await this.adminQuizRepository.findApprovedQuizById(
      input.quizId,
    );
    if (!quiz) {
      throw new AdminQuizNotFoundError();
    }

    const submittedAnswers = Array.isArray(input.answers)
      ? input.answers.map((answer) => String(answer ?? ""))
      : [];

    const questionResults: AdminQuizQuestionResult[] = await Promise.all(
      quiz.questions.map(async (question, index) => {
        const userAnswer = submittedAnswers[index] ?? "";
        const grading = await this.adminQuizGrading.gradeAnswer({
          expected: question.answer,
          userInput: userAnswer,
          quizType: quiz.quizType,
        });
        const metadata = this.questionMetadata.parse(question.options);

        return {
          question: question.question,
          expectedAnswer: question.answer,
          userAnswer,
          percentageSimilar: grading.percentageSimilar,
          isAccepted: grading.isAccepted,
          gradingMethod: grading.gradingMethod,
          confidence: grading.confidence,
          confidenceLevel: this.adminQuizGrading.toConfidenceLevel(
            grading.confidence,
          ),
          decisionReason: grading.decisionReason,
          reviewRequired: grading.reviewRequired,
          rawSimilarity: grading.rawSimilarity,
          ...(metadata.citation ? { citation: metadata.citation } : {}),
        };
      }),
    );

    const roundedScore = this.adminQuizGrading.calculateScore(
      questionResults,
    );

    // Ensure pending attempt exists
    await this.quizAttemptLifecycle.ensurePendingAttempt({
      userId: input.userId,
      quizId: quiz.id,
      quizTitle: quiz.title,
      allowedAttempts: quiz.allowedAttempts,
    });

    // Complete the attempt
    await this.quizAttemptLifecycle.completePendingAttempt({
      userId: input.userId,
      quizId: quiz.id,
      answers: {
        submittedAnswers,
        questionResults,
      },
      score: roundedScore,
    });

    return {
      quizId: quiz.id,
      title: quiz.title,
      quizType: quiz.quizType,
      score: roundedScore,
      questionResults,
    };
  }
}

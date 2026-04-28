import {
  AdminQuizGradingPort,
  AdminQuizGradingResult,
} from "@/application/ports/admin/AdminQuizGradingPort";
import { GradeOpenEndedAnswerUseCase } from "@/application/use-cases/quiz/GradeOpenEndedAnswerUseCase";
import { StringSimilarityAdapter } from "@/infrastructure/similarity/StringSimilarityAdapter";

/**
 * Adapter for admin quiz attempt grading
 * Implements grading logic for both MCQ and open-ended questions
 */
export class AdminQuizGradingAdapter implements AdminQuizGradingPort {
  private gradeOpenEndedAnswerUseCase: GradeOpenEndedAnswerUseCase;

  constructor() {
    this.gradeOpenEndedAnswerUseCase = new GradeOpenEndedAnswerUseCase(
      new StringSimilarityAdapter(),
    );
  }

  private normalizeText(value: string): string {
    return value.toLowerCase().replace(/\s+/g, " ").trim();
  }

  private scoreMcqAnswer(
    expected: string,
    userInput: string,
  ): AdminQuizGradingResult {
    const matches = this.normalizeText(expected) === this.normalizeText(userInput);

    return {
      percentageSimilar: matches ? 100 : 0,
      gradingMethod: "exact_match",
      isAccepted: matches,
      confidence: matches ? 0.99 : 0.97,
      decisionReason: matches
        ? "Exact option match."
        : "Selected option does not match the expected answer.",
      reviewRequired: false,
      rawSimilarity: matches ? 1 : 0,
    };
  }

  private async scoreOpenEndedAnswer(
    expected: string,
    userInput: string,
  ): Promise<AdminQuizGradingResult> {
    const grading = this.gradeOpenEndedAnswerUseCase.execute(expected, userInput);

    if (grading.gradingMethod === "exact_match") {
      return {
        percentageSimilar: 100,
        gradingMethod: "exact_match",
        isAccepted: true,
        confidence: 0.99,
        decisionReason: "Exact text match after normalization.",
        reviewRequired: false,
        rawSimilarity: 1,
      };
    }

    if (!this.normalizeText(userInput)) {
      return {
        percentageSimilar: 0,
        gradingMethod: "typo_tolerant",
        isAccepted: false,
        confidence: 0.4,
        decisionReason: "No answer provided.",
        reviewRequired: true,
        rawSimilarity: 0,
      };
    }

    const thresholdDistance = Math.abs(grading.rawScore - 0.8);

    const confidence = grading.isAccepted
      ? grading.rawScore >= 0.92
        ? 0.9
        : grading.rawScore >= 0.86
          ? 0.78
          : 0.66
      : grading.rawScore <= 0.45
        ? 0.88
        : grading.rawScore <= 0.7
          ? 0.72
          : 0.58;

    const decisionReason = grading.isAccepted
      ? `Accepted by typo-tolerant match (similarity ${Math.round(grading.rawScore * 100)}%).`
      : `Rejected by typo-tolerant match (similarity ${Math.round(grading.rawScore * 100)}%).`;

    return {
      percentageSimilar: grading.percentageSimilar,
      gradingMethod: "typo_tolerant",
      isAccepted: grading.isAccepted,
      confidence,
      decisionReason,
      reviewRequired: confidence < 0.7 || thresholdDistance < 0.06,
      rawSimilarity: grading.rawScore,
    };
  }

  async gradeAnswer(input: {
    expected: string;
    userInput: string;
    quizType: "mcq" | "open_ended";
  }): Promise<AdminQuizGradingResult> {
    if (input.quizType === "mcq") {
      return this.scoreMcqAnswer(input.expected, input.userInput);
    }

    return this.scoreOpenEndedAnswer(input.expected, input.userInput);
  }

  calculateScore(
    questionResults: Array<{ percentageSimilar: number }>,
  ): number {
    if (!questionResults.length) return 0;

    const totalSimilarity = questionResults.reduce(
      (total, result) => total + result.percentageSimilar,
      0,
    );
    return Math.round((totalSimilarity / questionResults.length) * 100) / 100;
  }

  toConfidenceLevel(
    confidence: number,
  ): "low" | "medium" | "high" {
    if (confidence >= 0.8) {
      return "high";
    }

    if (confidence >= 0.6) {
      return "medium";
    }

    return "low";
  }
}

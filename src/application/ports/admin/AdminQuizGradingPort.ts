/**
 * Port for admin quiz attempt grading
 * Defines the contract for grading quiz answers in the admin domain
 */

export type AdminQuizGradingMethod = "typo_tolerant" | "exact_match";

export interface AdminQuizGradingResult {
  percentageSimilar: number;
  gradingMethod: AdminQuizGradingMethod;
  isAccepted: boolean;
  confidence: number;
  decisionReason: string;
  reviewRequired: boolean;
  rawSimilarity: number;
}

export interface AdminQuizGradingPort {
  gradeAnswer(input: {
    expected: string;
    userInput: string;
    quizType: "mcq" | "open_ended";
  }): Promise<AdminQuizGradingResult>;

  calculateScore(
    questionResults: Array<{ percentageSimilar: number }>,
  ): number;

  toConfidenceLevel(
    confidence: number,
  ): "low" | "medium" | "high";
}

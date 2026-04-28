import { GradeOpenEndedAnswerUseCase } from "@/application/use-cases/quiz/GradeOpenEndedAnswerUseCase";
import { StringSimilarityAdapter } from "@/infrastructure/similarity/StringSimilarityAdapter";
import { getApprovedQuiz } from "@/server/admin/services/adminQuizService";
import {
  completePendingQuizAttempt,
  ensurePendingQuizAttempt,
} from "@/server/services/userQuizAttemptService";
import { parseQuestionMetadata } from "@/server/core/quizQuestionMetadata";

const gradeOpenEndedAnswerUseCase = new GradeOpenEndedAnswerUseCase(
  new StringSimilarityAdapter(),
);

export type AdminQuizGradingMethod =
  | "typo_tolerant"
  | "exact_match";

export type AdminQuizQuestionResult = {
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  percentageSimilar: number;
  isAccepted: boolean;
  gradingMethod: AdminQuizGradingMethod;
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

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function scoreMcqAnswer(expected: string, userInput: string) {
  const matches = normalizeText(expected) === normalizeText(userInput);

  return {
    percentageSimilar: matches ? 100 : 0,
    gradingMethod: "exact_match" as const,
    isAccepted: matches,
    confidence: matches ? 0.99 : 0.97,
    decisionReason: matches
      ? "Exact option match."
      : "Selected option does not match the expected answer.",
    reviewRequired: false,
    rawSimilarity: matches ? 1 : 0,
  };
}

function toConfidenceLevel(confidence: number) {
  if (confidence >= 0.8) {
    return "high" as const;
  }

  if (confidence >= 0.6) {
    return "medium" as const;
  }

  return "low" as const;
}

async function scoreOpenEndedAnswer(expected: string, userInput: string) {
  const grading = gradeOpenEndedAnswerUseCase.execute(expected, userInput);

  if (grading.gradingMethod === "exact_match") {
    return {
      percentageSimilar: 100,
      gradingMethod: "exact_match" as const,
      isAccepted: true,
      confidence: 0.99,
      decisionReason: "Exact text match after normalization.",
      reviewRequired: false,
      rawSimilarity: 1,
    };
  }

  if (!normalizeText(userInput)) {
    return {
      percentageSimilar: 0,
      gradingMethod: "typo_tolerant" as const,
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
    gradingMethod: "typo_tolerant" as const,
    isAccepted: grading.isAccepted,
    confidence,
    decisionReason,
    reviewRequired: confidence < 0.7 || thresholdDistance < 0.06,
    rawSimilarity: grading.rawScore,
  };
}

export async function submitAndGradeAdminQuizAttempt(input: {
  quizId: string;
  userId: string;
  answers: string[];
}): Promise<SubmitAdminQuizResult> {
  const quiz = await getApprovedQuiz(input.quizId);
  if (!quiz) {
    throw new AdminQuizNotFoundError();
  }

  const submittedAnswers = Array.isArray(input.answers)
    ? input.answers.map((answer) => String(answer ?? ""))
    : [];

  const questionResults: AdminQuizQuestionResult[] = await Promise.all(
    quiz.questions.map(async (question, index) => {
      const userAnswer = submittedAnswers[index] ?? "";
      const grading =
        quiz.quizType === "mcq"
          ? scoreMcqAnswer(question.answer, userAnswer)
          : await scoreOpenEndedAnswer(question.answer, userAnswer);
      const metadata = parseQuestionMetadata(question.options);

      return {
        question: question.question,
        expectedAnswer: question.answer,
        userAnswer,
        percentageSimilar: grading.percentageSimilar,
        isAccepted: grading.isAccepted,
        gradingMethod: grading.gradingMethod,
        confidence: grading.confidence,
        confidenceLevel: toConfidenceLevel(grading.confidence),
        decisionReason: grading.decisionReason,
        reviewRequired: grading.reviewRequired,
        rawSimilarity: grading.rawSimilarity,
        ...(metadata.citation ? { citation: metadata.citation } : {}),
      };
    }),
  );

  const score = questionResults.length
    ? questionResults.reduce((total, result) => total + result.percentageSimilar, 0) /
      questionResults.length
    : 0;

  const roundedScore = Math.round(score * 100) / 100;

  await ensurePendingQuizAttempt({
    userId: input.userId,
    quizId: quiz.id,
    quizTitle: quiz.title,
  });

  await completePendingQuizAttempt({
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

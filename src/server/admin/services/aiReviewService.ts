import {
  findUserQuizAttemptById,
  listCompletedUserQuizAttempts,
  updateUserQuizAttemptAnswersById,
} from "@/server/repositories/userQuizAttemptRepository";

type ConfidenceLevel = "low" | "medium" | "high";
type ReviewAction = "accept_ai" | "mark_incorrect" | "set_expected_answer";

type StoredQuestionResult = {
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  percentageSimilar: number;
  isAccepted: boolean;
  gradingMethod: "typo_tolerant" | "exact_match";
  confidence?: number;
  confidenceLevel?: ConfidenceLevel;
  decisionReason?: string;
  reviewRequired?: boolean;
  rawSimilarity?: number;
  citation?: {
    source: string;
    snippet: string;
    confidence?: number;
  };
};

type ReviewDecisionRecord = {
  status: "resolved";
  action: ReviewAction;
  reviewerId?: string;
  reviewerNote?: string;
  correctedAnswer?: string;
  reviewedAt: string;
  previousAccepted: boolean;
  overrideAccepted: boolean;
};

type StoredAttemptAnswersPayload = {
  submittedAnswers: string[];
  questionResults: StoredQuestionResult[];
  reviewDecisions: Record<string, ReviewDecisionRecord>;
};

export type AiReviewQueueItem = {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  userId: string;
  questionIndex: number;
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  decisionReason: string;
  rawSimilarity: number;
  reviewRequired: boolean;
  citation?: {
    source: string;
    snippet: string;
    confidence?: number;
  };
  completedAt?: Date | null;
};

export class AiReviewNotFoundError extends Error {
  constructor() {
    super("Attempt not found.");
    this.name = "AiReviewNotFoundError";
  }
}

export class AiReviewValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiReviewValidationError";
  }
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function toConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) {
    return "high";
  }

  if (confidence >= 0.6) {
    return "medium";
  }

  return "low";
}

function clampConfidence(value: unknown, acceptedFallback: boolean) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(1, value));
  }

  return acceptedFallback ? 0.9 : 0.55;
}

function parseAttemptAnswersPayload(raw: unknown): StoredAttemptAnswersPayload {
  const basePayload: StoredAttemptAnswersPayload = {
    submittedAnswers: [],
    questionResults: [],
    reviewDecisions: {},
  };

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return basePayload;
  }

  const payload = raw as {
    submittedAnswers?: unknown;
    questionResults?: unknown;
    reviewDecisions?: unknown;
  };

  const submittedAnswers = Array.isArray(payload.submittedAnswers)
    ? payload.submittedAnswers
        .filter((answer): answer is string => typeof answer === "string")
        .map((answer) => answer)
    : [];

  const questionResults = Array.isArray(payload.questionResults)
    ? payload.questionResults
        .map((questionResult): StoredQuestionResult | null => {
          if (
            !questionResult ||
            typeof questionResult !== "object" ||
            Array.isArray(questionResult)
          ) {
            return null;
          }

          const candidate = questionResult as {
            question?: unknown;
            expectedAnswer?: unknown;
            userAnswer?: unknown;
            percentageSimilar?: unknown;
            isAccepted?: unknown;
            gradingMethod?: unknown;
            confidence?: unknown;
            confidenceLevel?: unknown;
            decisionReason?: unknown;
            reviewRequired?: unknown;
            rawSimilarity?: unknown;
            citation?: unknown;
          };

          if (
            typeof candidate.question !== "string" ||
            typeof candidate.expectedAnswer !== "string" ||
            typeof candidate.userAnswer !== "string"
          ) {
            return null;
          }

          const percentageSimilar =
            typeof candidate.percentageSimilar === "number" &&
            Number.isFinite(candidate.percentageSimilar)
              ? Math.max(0, Math.min(100, candidate.percentageSimilar))
              : 0;

          const isAccepted = candidate.isAccepted === true;
          const confidence = clampConfidence(candidate.confidence, isAccepted);
          const confidenceLevel =
            candidate.confidenceLevel === "low" ||
            candidate.confidenceLevel === "medium" ||
            candidate.confidenceLevel === "high"
              ? candidate.confidenceLevel
              : toConfidenceLevel(confidence);

          const citation =
            candidate.citation && typeof candidate.citation === "object"
              ? (() => {
                  const rawCitation = candidate.citation as {
                    source?: unknown;
                    snippet?: unknown;
                    confidence?: unknown;
                  };

                  if (
                    typeof rawCitation.source !== "string" ||
                    typeof rawCitation.snippet !== "string"
                  ) {
                    return undefined;
                  }

                  const normalizedCitationConfidence =
                    typeof rawCitation.confidence === "number" &&
                    Number.isFinite(rawCitation.confidence)
                      ? Math.max(0, Math.min(1, rawCitation.confidence))
                      : undefined;

                  return {
                    source: rawCitation.source,
                    snippet: rawCitation.snippet,
                    ...(normalizedCitationConfidence !== undefined
                      ? { confidence: normalizedCitationConfidence }
                      : {}),
                  };
                })()
              : undefined;

          return {
            question: candidate.question,
            expectedAnswer: candidate.expectedAnswer,
            userAnswer: candidate.userAnswer,
            percentageSimilar,
            isAccepted,
            gradingMethod:
              candidate.gradingMethod === "exact_match"
                ? "exact_match"
                : "typo_tolerant",
            confidence,
            confidenceLevel,
            decisionReason:
              typeof candidate.decisionReason === "string"
                ? candidate.decisionReason
                : "No reason available.",
            reviewRequired:
              candidate.reviewRequired === true || confidence < 0.7,
            rawSimilarity:
              typeof candidate.rawSimilarity === "number" &&
              Number.isFinite(candidate.rawSimilarity)
                ? Math.max(0, Math.min(1, candidate.rawSimilarity))
                : percentageSimilar / 100,
            ...(citation ? { citation } : {}),
          };
        })
        .filter((result): result is StoredQuestionResult => result !== null)
    : [];

  const reviewDecisions =
    payload.reviewDecisions &&
    typeof payload.reviewDecisions === "object" &&
    !Array.isArray(payload.reviewDecisions)
      ? (payload.reviewDecisions as Record<string, ReviewDecisionRecord>)
      : {};

  return {
    submittedAnswers,
    questionResults,
    reviewDecisions,
  };
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function buildScoreFromQuestionResults(questionResults: StoredQuestionResult[]) {
  if (questionResults.length === 0) {
    return 0;
  }

  const total = questionResults.reduce(
    (sum, questionResult) => sum + questionResult.percentageSimilar,
    0,
  );
  return roundToTwo(total / questionResults.length);
}

export async function getAiReviewQueue() {
  const attempts = await listCompletedUserQuizAttempts();
  const queueItems: AiReviewQueueItem[] = [];
  let totalQuestionResults = 0;

  for (const attempt of attempts) {
    const payload = parseAttemptAnswersPayload(attempt.answers);

    payload.questionResults.forEach((questionResult, index) => {
      totalQuestionResults += 1;

      const reviewDecision = payload.reviewDecisions[String(index)];
      const isResolved = reviewDecision?.status === "resolved";
      const reviewRequired =
        questionResult.reviewRequired === true ||
        (questionResult.confidence ?? 0) < 0.7;

      if (!reviewRequired || isResolved) {
        return;
      }

      queueItems.push({
        attemptId: attempt.id,
        quizId: attempt.quizId,
        quizTitle: attempt.quizTitle,
        userId: attempt.userId,
        questionIndex: index,
        question: questionResult.question,
        expectedAnswer: questionResult.expectedAnswer,
        userAnswer: questionResult.userAnswer,
        confidence: questionResult.confidence ?? 0.55,
        confidenceLevel:
          questionResult.confidenceLevel ??
          toConfidenceLevel(questionResult.confidence ?? 0.55),
        decisionReason: questionResult.decisionReason || "No reason available.",
        rawSimilarity: questionResult.rawSimilarity ?? questionResult.percentageSimilar / 100,
        reviewRequired: true,
        ...(questionResult.citation ? { citation: questionResult.citation } : {}),
        completedAt: attempt.completedAt,
      });
    });
  }

  return {
    items: queueItems,
    summary: {
      pendingItems: queueItems.length,
      highPriorityItems: queueItems.filter((item) => item.confidence < 0.55)
        .length,
      totalQuestionResults,
      lowConfidenceRate:
        totalQuestionResults > 0
          ? roundToTwo((queueItems.length / totalQuestionResults) * 100)
          : 0,
    },
  };
}

export async function resolveAiReviewItem(input: {
  attemptId: string;
  questionIndex: number;
  action: ReviewAction;
  correctedAnswer?: string;
  reviewerId?: string;
  reviewerNote?: string;
}) {
  const attempt = await findUserQuizAttemptById(input.attemptId);
  if (!attempt) {
    throw new AiReviewNotFoundError();
  }

  if (!Number.isInteger(input.questionIndex) || input.questionIndex < 0) {
    throw new AiReviewValidationError("questionIndex must be a non-negative integer.");
  }

  const payload = parseAttemptAnswersPayload(attempt.answers);
  const targetResult = payload.questionResults[input.questionIndex];

  if (!targetResult) {
    throw new AiReviewValidationError("Target question result was not found.");
  }

  const updatedResult: StoredQuestionResult = { ...targetResult };
  let overrideAccepted = targetResult.isAccepted;

  if (input.action === "accept_ai") {
    overrideAccepted = targetResult.isAccepted;
    updatedResult.reviewRequired = false;
  } else if (input.action === "mark_incorrect") {
    overrideAccepted = false;
    updatedResult.isAccepted = false;
    updatedResult.percentageSimilar = 0;
    updatedResult.reviewRequired = false;
    updatedResult.decisionReason = "Admin override: marked as incorrect.";
  } else {
    const correctedAnswer = input.correctedAnswer?.trim();
    if (!correctedAnswer) {
      throw new AiReviewValidationError(
        "correctedAnswer is required when action is set_expected_answer.",
      );
    }

    updatedResult.expectedAnswer = correctedAnswer;
    overrideAccepted =
      normalizeText(correctedAnswer) === normalizeText(updatedResult.userAnswer);
    updatedResult.isAccepted = overrideAccepted;
    updatedResult.percentageSimilar = overrideAccepted ? 100 : 0;
    updatedResult.reviewRequired = false;
    updatedResult.decisionReason = `Admin override: expected answer updated to \"${correctedAnswer}\".`;
  }

  payload.questionResults[input.questionIndex] = updatedResult;
  payload.reviewDecisions[String(input.questionIndex)] = {
    status: "resolved",
    action: input.action,
    ...(input.reviewerId ? { reviewerId: input.reviewerId } : {}),
    ...(input.reviewerNote ? { reviewerNote: input.reviewerNote } : {}),
    ...(input.correctedAnswer ? { correctedAnswer: input.correctedAnswer } : {}),
    reviewedAt: new Date().toISOString(),
    previousAccepted: targetResult.isAccepted,
    overrideAccepted,
  };

  const updatedScore = buildScoreFromQuestionResults(payload.questionResults);

  await updateUserQuizAttemptAnswersById({
    attemptId: input.attemptId,
    answers: payload,
    score: updatedScore,
  });

  return {
    attemptId: input.attemptId,
    questionIndex: input.questionIndex,
    score: updatedScore,
    updatedResult,
    reviewDecision: payload.reviewDecisions[String(input.questionIndex)],
  };
}

export async function getAiEvaluationMetrics() {
  const attempts = await listCompletedUserQuizAttempts();

  let totalQuestionResults = 0;
  let acceptedCount = 0;
  let lowConfidenceCount = 0;
  let confidenceSum = 0;
  let similaritySum = 0;
  let reviewedCount = 0;
  let overrideCount = 0;

  for (const attempt of attempts) {
    const payload = parseAttemptAnswersPayload(attempt.answers);

    for (const questionResult of payload.questionResults) {
      totalQuestionResults += 1;
      if (questionResult.isAccepted) {
        acceptedCount += 1;
      }

      const confidence = questionResult.confidence ?? 0.55;
      confidenceSum += confidence;
      similaritySum += questionResult.rawSimilarity ?? questionResult.percentageSimilar / 100;

      if (confidence < 0.7 || questionResult.reviewRequired) {
        lowConfidenceCount += 1;
      }
    }

    const decisions = Object.values(payload.reviewDecisions);
    reviewedCount += decisions.length;
    overrideCount += decisions.filter(
      (decision) => decision.previousAccepted !== decision.overrideAccepted,
    ).length;
  }

  return {
    totalAttempts: attempts.length,
    totalQuestionResults,
    acceptanceRate:
      totalQuestionResults > 0
        ? roundToTwo((acceptedCount / totalQuestionResults) * 100)
        : 0,
    lowConfidenceRate:
      totalQuestionResults > 0
        ? roundToTwo((lowConfidenceCount / totalQuestionResults) * 100)
        : 0,
    reviewedRate:
      totalQuestionResults > 0
        ? roundToTwo((reviewedCount / totalQuestionResults) * 100)
        : 0,
    overrideRate:
      reviewedCount > 0 ? roundToTwo((overrideCount / reviewedCount) * 100) : 0,
    averageConfidence:
      totalQuestionResults > 0 ? roundToTwo(confidenceSum / totalQuestionResults) : 0,
    averageSimilarity:
      totalQuestionResults > 0 ? roundToTwo(similaritySum / totalQuestionResults) : 0,
  };
}

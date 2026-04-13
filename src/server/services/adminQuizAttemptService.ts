import stringSimilarity from "string-similarity";
import { getApprovedQuiz } from "@/server/services/adminQuizService";
import { saveUserQuizAttempt } from "@/server/services/userQuizAttemptService";

const TYPO_TOLERANCE_THRESHOLD = 0.8;

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

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function toPercentage(score: number) {
  return Math.round(clamp01(score) * 100);
}

function lexicalSimilarity(expected: string, userInput: string) {
  return stringSimilarity.compareTwoStrings(
    normalizeText(expected),
    normalizeText(userInput),
  );
}

function hasSingleAdjacentSwap(expected: string, userInput: string) {
  if (expected.length !== userInput.length || expected.length < 2) {
    return false;
  }

  const mismatchIndexes: number[] = [];
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== userInput[i]) {
      mismatchIndexes.push(i);
      if (mismatchIndexes.length > 2) {
        return false;
      }
    }
  }

  if (mismatchIndexes.length !== 2) {
    return false;
  }

  const [first, second] = mismatchIndexes;
  if (second !== first + 1) {
    return false;
  }

  return (
    expected[first] === userInput[second] &&
    expected[second] === userInput[first]
  );
}

function typoSimilarity(expected: string, userInput: string) {
  if (hasSingleAdjacentSwap(expected, userInput)) {
    return 1;
  }

  return lexicalSimilarity(expected, userInput);
}

function scoreMcqAnswer(expected: string, userInput: string) {
  const matches = normalizeText(expected) === normalizeText(userInput);
  return {
    percentageSimilar: matches ? 100 : 0,
    gradingMethod: "exact_match" as const,
    isAccepted: matches,
  };
}

async function scoreOpenEndedAnswer(expected: string, userInput: string) {
  const normalizedExpected = normalizeText(expected);
  const normalizedUserInput = normalizeText(userInput);

  if (!normalizedExpected && !normalizedUserInput) {
    return {
      percentageSimilar: 100,
      gradingMethod: "exact_match" as const,
      isAccepted: true,
    };
  }

  if (!normalizedUserInput) {
    return {
      percentageSimilar: 0,
      gradingMethod: "typo_tolerant" as const,
      isAccepted: false,
    };
  }

  if (normalizedExpected === normalizedUserInput) {
    return {
      percentageSimilar: 100,
      gradingMethod: "exact_match" as const,
      isAccepted: true,
    };
  }

  const lexicalScore = typoSimilarity(normalizedExpected, normalizedUserInput);
  const isAccepted = lexicalScore >= TYPO_TOLERANCE_THRESHOLD;
  return {
    percentageSimilar: isAccepted ? 100 : 0,
    gradingMethod: "typo_tolerant" as const,
    isAccepted,
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

      return {
        question: question.question,
        expectedAnswer: question.answer,
        userAnswer,
        percentageSimilar: grading.percentageSimilar,
        isAccepted: grading.isAccepted,
        gradingMethod: grading.gradingMethod,
      };
    }),
  );

  const score = questionResults.length
    ? questionResults.reduce((total, result) => total + result.percentageSimilar, 0) /
      questionResults.length
    : 0;

  const roundedScore = Math.round(score * 100) / 100;

  await saveUserQuizAttempt({
    userId: input.userId,
    quizId: quiz.id,
    quizTitle: quiz.title,
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

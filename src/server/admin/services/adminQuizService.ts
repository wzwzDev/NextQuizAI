import {
  createAdminQuiz,
  deleteAdminQuizById,
  findAdminQuizzes,
  findAllUserQuizAttempts,
  findApprovedQuizById,
} from "@/server/admin/repositories/adminQuizRepository";

const MIN_MCQ_OPTIONS = 2;
const MAX_OPEN_ENDED_ANSWER_WORDS = 6;

function splitOptionChunks(option: string): string[] {
  if (!option) {
    return [];
  }

  return option
    .split(/\r?\n|[,;|]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeOptions(options: string[] | undefined) {
  if (!Array.isArray(options)) {
    return [];
  }

  return Array.from(
    new Set(
      options
        .filter((value): value is string => typeof value === "string")
        .flatMap(splitOptionChunks),
    ),
  );
}

export async function createApprovedAdminQuiz(input: {
  title?: string;
  fileName?: string;
  category: string;
  difficulty: string;
  quizType?: "mcq" | "open_ended";
  questions: Array<{ question: string; answer: string; options?: string[] }>;
}) {
  let title = input.title?.trim() ?? "";
  if (!title && input.fileName) {
    title = input.fileName.replace(/\.[^/.]+$/, "");
  }
  if (!title) {
    title = "Untitled Quiz";
  }

  const normalizedQuizType = input.quizType ?? "open_ended";
  const normalizedQuestions = input.questions.map((question, index) => {
    const normalizedQuestion = question.question.trim();
    const normalizedAnswer = question.answer.trim();

    if (!normalizedQuestion || !normalizedAnswer) {
      throw new Error(
        `Question ${index + 1} must include both question and answer text.`,
      );
    }

    if (normalizedQuizType !== "mcq") {
      const answerWordCount = normalizedAnswer
        .split(/\s+/)
        .filter(Boolean).length;

      if (answerWordCount > MAX_OPEN_ENDED_ANSWER_WORDS) {
        throw new Error(
          `Question ${index + 1} has an open-ended answer that is too long. Use a short exact answer (max ${MAX_OPEN_ENDED_ANSWER_WORDS} words).`,
        );
      }

      return {
        question: normalizedQuestion,
        answer: normalizedAnswer,
      };
    }

    const options = normalizeOptions([...(question.options ?? []), normalizedAnswer]);
    if (options.length < MIN_MCQ_OPTIONS) {
      throw new Error(
        `Question ${index + 1} must contain at least ${MIN_MCQ_OPTIONS} choices for MCQ.`,
      );
    }

    return {
      question: normalizedQuestion,
      answer: normalizedAnswer,
      options,
    };
  });

  return createAdminQuiz({
    title,
    category: input.category,
    difficulty: input.difficulty,
    quizType: normalizedQuizType,
    status: "approved",
    questions: normalizedQuestions,
  });
}

export async function getAdminQuizzes(filter?: {
  category?: string;
  difficulty?: string;
}) {
  return findAdminQuizzes(filter);
}

export async function removeAdminQuiz(id: string) {
  return deleteAdminQuizById(id);
}

export async function getApprovedQuiz(id: string) {
  return findApprovedQuizById(id);
}

export async function getQuizStatisticsSummary() {
  const attempts = await findAllUserQuizAttempts();

  const statsMap: Record<
    string,
    { quizId: string; attempts: number; totalScore: number }
  > = {};

  for (const attempt of attempts) {
    if (!statsMap[attempt.quizTitle]) {
      statsMap[attempt.quizTitle] = {
        quizId: attempt.quizId,
        attempts: 0,
        totalScore: 0,
      };
    }
    statsMap[attempt.quizTitle].attempts += 1;
    statsMap[attempt.quizTitle].totalScore += attempt.score || 0;
  }

  return Object.entries(statsMap).map(([quizTitle, data]) => ({
    quizId: data.quizId,
    quizTitle,
    attempts: data.attempts,
    averageScore:
      data.attempts > 0
        ? Math.round((data.totalScore / data.attempts) * 100) / 100
        : 0,
    completionRate: 100,
  }));
}

import { AdminQuizRepositoryPort } from "@/application/ports/admin/AdminQuizRepositoryPort";

const MIN_MCQ_OPTIONS = 2;

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

/**
 * Use case for creating an approved admin quiz
 * Validates and normalizes quiz questions before creation
 */
export class CreateAdminQuizUseCase {
  constructor(private adminQuizRepository: AdminQuizRepositoryPort) {}

  async execute(input: {
    title?: string;
    fileName?: string;
    category: string;
    difficulty: string;
    quizType?: "mcq" | "open_ended";
    questions: Array<{
      question: string;
      answer: string;
      options?: string[];
      citation?: { source: string; snippet: string; confidence?: number };
    }>;
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
        return {
          question: normalizedQuestion,
          answer: normalizedAnswer,
          ...(question.citation ? { citation: question.citation } : {}),
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
        ...(question.citation ? { citation: question.citation } : {}),
      };
    });

    return this.adminQuizRepository.createApprovedQuiz({
      title,
      category: input.category,
      difficulty: input.difficulty,
      quizType: normalizedQuizType,
      status: "approved",
      questions: normalizedQuestions,
    });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { generateQuestionsFromUploadedFile } from "@/server/services/uploadQuizGenerationService";
import { z } from "zod";

export const maxDuration = 60;

// Constants
const MIN_QUESTION_COUNT = 1;
const MAX_QUESTION_COUNT = 15;
const DEFAULT_QUESTION_COUNT = 5;
const VALID_CONTENT_TYPES = ["multipart/form-data", "application/x-www-form-urlencoded"];
const KNOWN_CLIENT_ERRORS = new Set([
  "Only JSON, TXT, or PDF files are accepted.",
  "Invalid JSON file.",
  "Invalid PDF file.",
  "Could not extract readable text from PDF.",
  "Extracted PDF text quality is too low. Please upload a clearer PDF or a text-based file.",
  "No course content found in JSON.",
  "Course content is too short or missing.",
  "No valid questions could be generated from the uploaded file.",
]);
const RATE_LIMIT_PATTERN = /rate limit|\b429\b/i;

// Validation schema
const formDataSchema = z.object({
  file: z.instanceof(File),
  category: z.string().optional(),
  difficulty: z.string().optional(),
  quizType: z.enum(["mcq", "open_ended"]),
  questionCount: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await getAuthSession(req);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate content type
    const contentType = req.headers.get("content-type") ?? "";
    const hasValidContentType = VALID_CONTENT_TYPES.some((type) =>
      contentType.startsWith(type),
    );

    if (!hasValidContentType) {
      return NextResponse.json(
        {
          error:
            "Content-Type must be multipart/form-data or application/x-www-form-urlencoded.",
        },
        { status: 400 },
      );
    }

    // Parse and validate form data
    const formData = await req.formData();
    const file = formData.get("file");
    const category = String(formData.get("category") ?? "").trim() || undefined;
    const difficulty = String(formData.get("difficulty") ?? "").trim() || undefined;
    const rawQuizType = String(formData.get("quizType") ?? "").trim();
    const rawQuestionCount = Number(formData.get("questionCount") ?? DEFAULT_QUESTION_COUNT);

    // Validate file
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Normalize and validate quiz type
    const quizType =
      rawQuizType === "mcq" ? ("mcq" as const) : ("open_ended" as const);

    // Normalize and validate question count
    const questionCount = Number.isFinite(rawQuestionCount)
      ? Math.max(MIN_QUESTION_COUNT, Math.min(MAX_QUESTION_COUNT, Math.round(rawQuestionCount)))
      : DEFAULT_QUESTION_COUNT;

    // Generate questions
    const questions = await generateQuestionsFromUploadedFile(file, {
      category,
      difficulty,
      quizType,
      questionCount,
    });

    return NextResponse.json({
      questions,
      generationOptions: {
        category: category ?? null,
        difficulty: difficulty ?? null,
        quizType,
        questionCount,
      },
    });
  } catch (error) {
    return handleQuizGenerationError(error);
  }
}

/**
 * Centralized error handling for quiz generation errors
 */
function handleQuizGenerationError(error: unknown): NextResponse {
  if (!(error instanceof Error)) {
    return NextResponse.json(
      { questions: [], error: "Failed to generate quiz." },
      { status: 500 },
    );
  }

  const { message } = error;

  // Handle known client errors
  if (KNOWN_CLIENT_ERRORS.has(message)) {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Handle OpenAI generation errors
  if (message.startsWith("OpenAI generation failed:")) {
    if (RATE_LIMIT_PATTERN.test(message)) {
      return NextResponse.json(
        {
          questions: [],
          error:
            "Rate limit reached while generating quiz questions. Please retry in a few seconds.",
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { questions: [], error: message },
      { status: 502 },
    );
  }

  // Handle OpenAI OCR errors
  if (message.startsWith("OpenAI OCR failed:")) {
    if (RATE_LIMIT_PATTERN.test(message)) {
      return NextResponse.json(
        {
          questions: [],
          error:
            "Rate limit reached while processing PDF OCR. Please retry in a few seconds.",
        },
        { status: 429 },
      );
    }

    const debugDetails =
      process.env.NODE_ENV === "production"
        ? undefined
        : message.replace(/^OpenAI OCR failed:\s*/i, "");

    return NextResponse.json(
      {
        questions: [],
        error:
          "PDF text extraction failed due to an upstream OCR provider issue. Please retry or upload a text-based PDF.",
        ...(debugDetails ? { details: debugDetails } : {}),
      },
      { status: 502 },
    );
  }

  // Generic error fallback
  return NextResponse.json(
    { questions: [], error: "Failed to generate quiz." },
    { status: 500 },
  );
}

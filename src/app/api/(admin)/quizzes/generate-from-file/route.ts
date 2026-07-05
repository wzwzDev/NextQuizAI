/**
 * POST /(admin)/quizzes/generate-from-file
 * 
 * Purpose: Generate questions from uploaded file
 * Responsibility: SINGLE - Just generate questions
 * 
 * Input: FormData { file, category?, difficulty?, quizType, questionCount }
 * Output: { questions: [], fileType, format }
 * 
 * Status Codes:
 * - 200: Questions generated
 * - 400: Invalid file or generation failed
 * - 401: Not admin
 * - 429: Rate limited
 * - 500: Server error
 */

import { NextResponse, NextRequest } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { generateQuestionsFromUploadedFile } from "@/server/services/uploadQuizGenerationService";
import { z } from "zod";

// Constants
const MIN_QUESTION_COUNT = 1;
const MAX_QUESTION_COUNT = 50;
const RATE_LIMIT_PATTERN = /rate limit/i;

// Validation schema for form data (excluding file)
const formDataSchema = z.object({
  category: z.string().nullish(),
  difficulty: z.enum(["easy", "medium", "hard"]).nullish(),
  quizType: z.enum(["mcq", "open_ended"], {
    errorMap: () => ({ message: "Invalid quiz type" }),
  }),
  questionCount: z
    .coerce.number()
    .int()
    .min(
      MIN_QUESTION_COUNT,
      `Question count must be between ${MIN_QUESTION_COUNT} and ${MAX_QUESTION_COUNT}`,
    )
    .max(
      MAX_QUESTION_COUNT,
      `Question count must be between ${MIN_QUESTION_COUNT} and ${MAX_QUESTION_COUNT}`,
    ),
});

type FormDataInput = z.infer<typeof formDataSchema>;

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await getAuthSession(req);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "You must be an admin to generate questions." },
        { status: 401 },
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file");
    const categoryValue = formData.get("category");
    const difficultyValue = formData.get("difficulty");
    const quizTypeValue = formData.get("quizType");
    const questionCountValue = formData.get("questionCount");

    // Validate file manually (must be File instance)
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No valid file uploaded." },
        { status: 400 },
      );
    }

    // Validate other form data using schema
    // Convert empty strings to null for Zod nullish validation
    // Zod's coerce will handle questionCount conversion
    const validated: FormDataInput = await formDataSchema.parseAsync({
      category:
        categoryValue && categoryValue !== ""
          ? String(categoryValue)
          : null,
      difficulty:
        difficultyValue && difficultyValue !== ""
          ? String(difficultyValue)
          : null,
      quizType: String(quizTypeValue),
      questionCount: questionCountValue,
    });

    // Execute: Generate questions
    const result = await generateQuestionsFromUploadedFile(file, {
      category: validated.category || undefined,
      difficulty: validated.difficulty || undefined,
      quizType: validated.quizType,
      questionCount: validated.questionCount,
    });

    // Return result
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleGenerationError(error);
  }
}

/**
 * Centralized error handling for question generation
 */
function handleGenerationError(error: unknown): NextResponse {
  // Handle validation errors
  if (error instanceof z.ZodError) {
    const errorMessages = error.issues
      .map((issue) => issue.message)
      .join("; ");
    return NextResponse.json(
      { error: errorMessages || "Validation failed" },
      { status: 400 },
    );
  }

  // Handle generation errors
  if (error instanceof Error) {
    // Handle rate limiting
    if (RATE_LIMIT_PATTERN.test(error.message)) {
      return NextResponse.json(
        {
          error: "Rate limit reached. Please retry in a few seconds.",
        },
        { status: 429 },
      );
    }

    // Handle other generation errors with generic message for security
    return NextResponse.json(
      { error: "Failed to generate questions from file" },
      { status: 400 },
    );
  }

  // Unexpected errors
  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 },
  );
}

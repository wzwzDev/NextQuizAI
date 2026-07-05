/**
 * POST /api/quiz/[quizId]/start
 * 
 * Purpose: Start a quiz attempt for user
 * Responsibility: SINGLE - Just create/get pending attempt
 * 
 * Input: { quizId } (from URL)
 * Output: { attemptId, quiz, questions, allowedAttempts, completedAttempts }
 * 
 * Status Codes:
 * - 200: Attempt started
 * - 400: Invalid quizId or max attempts exceeded
 * - 401: Not authenticated
 * - 404: Quiz not found
 * - 500: Server error
 */

import { NextResponse, NextRequest } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { getApprovedQuiz } from "@/server/admin/services/adminQuizService";
import { ensurePendingQuizAttempt, getCompletedUserQuizAttempts } from "@/server/services/userQuizAttemptService";
import { z } from "zod";

const quizIdSchema = z.string().uuid("Invalid quiz ID format");

// Clean AI metadata from question text
function cleanQuestionMetadata(question: string): string {
  // Remove everything from "Source:" to the next sentence-ending punctuation or "(Citation"
  // This handles cases where metadata is mixed into the question text
  let cleaned = question.replace(/\s*Source:\s*[^(]*?\(Citation[^)]*\)/gi, "");

  // If "Source:" wasn't in full pattern, try removing just "Source: filename -" prefix
  if (cleaned === question) {
    cleaned = question.replace(/Source:\s*[^-]*\s*-\s*/gi, "");
  }

  // Remove "(Citation confidence: XX%)" or similar patterns
  cleaned = cleaned.replace(/\s*\(Citation\s+confidence:\s*\d+%?\)/gi, "");

  // Remove any remaining "(Citation ...)" patterns
  cleaned = cleaned.replace(/\s*\(Citation[^)]*\)/gi, "");

  // Clean up extra whitespace and line breaks
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { quizId: string } },
) {
  try {
    // Authentication
    const session = await getAuthSession(req);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to start a quiz." },
        { status: 401 },
      );
    }

    // Validate input
    const quizId = quizIdSchema.parse(params.quizId);

    // Retrieve quiz details
    const quiz = await getApprovedQuiz(quizId);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Get user's completed attempt count
    const completedAttempts = await getCompletedUserQuizAttempts(
      session.user.id,
      quizId,
    );

    // Check max attempts (default 3)
    const maxAttempts = quiz.allowedAttempts || 3;
    if (completedAttempts >= maxAttempts) {
      return NextResponse.json(
        {
          error: "Maximum attempts reached for this quiz",
          completedAttempts,
          maxAttempts,
        },
        { status: 400 },
      );
    }

    // Create or get pending attempt
    const attempt = await ensurePendingQuizAttempt({
      userId: session.user.id,
      quizId,
      quizTitle: quiz.title,
      allowedAttempts: maxAttempts,
    });

    // Return result with quiz details
    return NextResponse.json(
      {
        attemptId: attempt.id,
        quiz: {
          ...quiz,
          questions: quiz.questions.map((q) => ({
            ...q,
            question: cleanQuestionMetadata(q.question),
          })),
        },
        questions: quiz.questions.map((q) => ({
          ...q,
          question: cleanQuestionMetadata(q.question),
        })),
        allowedAttempts: maxAttempts,
        completedAttempts,
      },
      { status: 200 },
    );
  } catch (error) {
    // Validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid quiz ID" },
        { status: 400 },
      );
    }

    // Unexpected errors
    if (error instanceof Error) {
      console.error("Start quiz error:", error.message);
      return NextResponse.json(
        { error: "Failed to start quiz" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

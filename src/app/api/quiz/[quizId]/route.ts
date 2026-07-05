/**
 * GET /api/quiz/[quizId]
 * 
 * Purpose: Get quiz details and questions
 * Responsibility: SINGLE - Just retrieve quiz data
 * 
 * Input: { quizId } (from URL)
 * Output: { quiz }
 * 
 * Status Codes:
 * - 200: Quiz retrieved
 * - 400: Invalid quizId
 * - 401: Not authenticated
 * - 404: Quiz not found
 * - 500: Server error
 */

import { NextResponse, NextRequest } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { getApprovedQuiz } from "@/server/admin/services/adminQuizService";
import { z } from "zod";

const quizIdSchema = z.string().uuid("Invalid quiz ID format");

export async function GET(
  req: NextRequest,
  { params }: { params: { quizId: string } },
) {
  try {
    // Authentication
    const session = await getAuthSession(req);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to view quizzes." },
        { status: 401 },
      );
    }

    // Validate input
    const quizId = quizIdSchema.parse(params.quizId);

    // Execute: Retrieve quiz
    const quiz = await getApprovedQuiz(quizId);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Return result
    return NextResponse.json({ quiz }, { status: 200 });
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
      console.error("Get quiz error:", error.message);
      return NextResponse.json(
        { error: "Failed to retrieve quiz" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

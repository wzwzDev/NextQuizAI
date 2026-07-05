/**
 * GET /api/quiz/[quizId]/attempts
 * 
 * Purpose: Get user's attempt history for a quiz
 * Responsibility: SINGLE - Just retrieve attempt history
 * 
 * Input: { quizId } (from URL)
 * Output: { attempts: [{ id, status, score, date }] }
 * 
 * Status Codes:
 * - 200: Attempts retrieved
 * - 400: Invalid quizId
 * - 401: Not authenticated
 * - 404: Quiz not found
 * - 500: Server error
 */

import { NextResponse, NextRequest } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { getAttemptsByUserAndQuizIds } from "@/server/services/userQuizAttemptService";
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
        { error: "You must be logged in to view attempts." },
        { status: 401 },
      );
    }

    // Validate input
    const quizId = quizIdSchema.parse(params.quizId);

    // Execute: Get user's attempts
    const attempts = await getAttemptsByUserAndQuizIds(
      session.user.id,
      [quizId],
    );

    // Return result
    return NextResponse.json(
      {
        attempts: attempts.map((attempt: any) => ({
          id: attempt.id,
          status: attempt.isPending ? "pending" : "completed",
          score: attempt.score,
          correctAnswers: attempt.correctAnswers,
          totalQuestions: attempt.totalQuestions,
          date: attempt.createdAt,
        })),
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
      console.error("Get attempts error:", error.message);
      return NextResponse.json(
        { error: "Failed to retrieve attempts" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

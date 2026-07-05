/**
 * Admin Quiz Resource Endpoints
 * GET /(admin)/quizzes/[quizId] - Get single quiz
 * PUT /(admin)/quizzes/[quizId] - Update quiz
 * DELETE /(admin)/quizzes/[quizId] - Delete quiz
 * 
 * Single Responsibility: Manage individual quiz resource
 */

import { NextResponse, NextRequest } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import {
  getApprovedQuiz,
  removeAdminQuiz,
} from "@/server/admin/services/adminQuizService";
import { z } from "zod";

// Validation schemas
const quizIdSchema = z.string().uuid("Invalid quiz ID format");

const updateQuizSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  category: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  questions: z.array(z.any()).optional(),
});

/**
 * GET /(admin)/quizzes/[quizId]
 * Get single quiz details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { quizId: string } },
) {
  try {
    // Authentication
    const session = await getAuthSession(req);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "You must be an admin to view quizzes." },
        { status: 401 },
      );
    }

    // Validate input
    const quizId = quizIdSchema.parse(params.quizId);

    // Execute: Get quiz
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

/**
 * PUT /(admin)/quizzes/[quizId]
 * Update quiz details
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { quizId: string } },
) {
  try {
    // Authentication
    const session = await getAuthSession(req);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "You must be an admin to update quizzes." },
        { status: 401 },
      );
    }

    // Validate input
    quizIdSchema.parse(params.quizId);
    const body = await req.json();
    // Parse and validate request body
    updateQuizSchema.parse(body);

    // Execute: Update quiz - Currently not implemented in service layer
    return NextResponse.json(
      { error: "Quiz update not yet implemented" },
      { status: 501 },
    );
  } catch (error) {
    // Validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }

    // Unexpected errors
    if (error instanceof Error) {
      console.error("Update quiz error:", error.message);
      return NextResponse.json(
        { error: "Failed to update quiz" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /(admin)/quizzes/[quizId]
 * Delete quiz
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { quizId: string } },
) {
  try {
    // Authentication
    const session = await getAuthSession(req);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "You must be an admin to delete quizzes." },
        { status: 401 },
      );
    }

    // Validate input
    const quizId = quizIdSchema.parse(params.quizId);

    // Execute: Delete quiz
    await removeAdminQuiz(quizId);

    // Return result
    return NextResponse.json(
      { message: "Quiz deleted successfully" },
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
      console.error("Delete quiz error:", error.message);
      return NextResponse.json(
        { error: "Failed to delete quiz" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

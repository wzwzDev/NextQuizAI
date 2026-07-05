/**
 * Admin Quizzes Endpoints
 * POST /(admin)/quizzes - Create quiz
 * GET /(admin)/quizzes - List quizzes
 * 
 * Single Responsibility: Manage quiz CRUD operations
 */

import { NextResponse, NextRequest } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import {
  createApprovedAdminQuiz,
  getAdminQuizzes,
} from "@/server/admin/services/adminQuizService";
import { z } from "zod";

// Validation schemas
const createQuizSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  difficulty: z
    .enum(["easy", "medium", "hard"], { message: "Difficulty must be easy, medium, or hard" }),
  questions: z.array(z.any()).min(1, "At least one question required"),
  quizType: z.enum(["mcq", "open_ended"]).optional(),
  fileName: z.string().optional(),
});

const listQuizzesSchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  page: z.coerce.number().positive().optional().catch(undefined),
  limit: z.coerce.number().positive().optional().catch(undefined),
});

/**
 * POST /(admin)/quizzes
 * Create a new quiz
 */
export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await getAuthSession(req);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "You must be an admin to create quizzes." },
        { status: 401 },
      );
    }

    // Parse and validate input
    const body = await req.json();
    const data = createQuizSchema.parse(body);

    // Execute: Create quiz
    const quiz = await createApprovedAdminQuiz({
      title: data.title,
      category: data.category,
      difficulty: data.difficulty,
      quizType: data.quizType,
      fileName: data.fileName,
      questions: data.questions,
    });

    // Return result
    return NextResponse.json(
      { quiz, message: "Quiz created successfully" },
      { status: 201 },
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
      console.error("Create quiz error:", error.message);
      return NextResponse.json(
        { error: "Failed to create quiz" },
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
 * GET /(admin)/quizzes
 * List quizzes with optional filters
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication
    const session = await getAuthSession(req);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "You must be an admin to view quizzes." },
        { status: 401 },
      );
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const data = listQuizzesSchema.parse({
      category: searchParams.get("category"),
      difficulty: searchParams.get("difficulty"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    // Execute: Get quizzes
    const allQuizzes = await getAdminQuizzes({
      category: data.category,
      difficulty: data.difficulty,
    });

    // Pagination
    const total = Array.isArray(allQuizzes) ? allQuizzes.length : 0;
    const page = data.page || 1;
    const limit = data.limit || 10;
    const start = (page - 1) * limit;
    const quizzes = Array.isArray(allQuizzes)
      ? allQuizzes.slice(start, start + limit)
      : [];

    // Return result
    return NextResponse.json(
      {
        quizzes,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    // Validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", issues: error.issues },
        { status: 400 },
      );
    }

    // Unexpected errors
    if (error instanceof Error) {
      console.error("List quizzes error:", error.message);
      return NextResponse.json(
        { error: "Failed to retrieve quizzes" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

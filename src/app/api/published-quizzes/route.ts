/**
 * Public Published Quizzes Endpoint
 * GET /api/published-quizzes - List approved quizzes available for users
 * 
 * This is the public endpoint that home page uses to display
 * available quizzes that users can start.
 * Includes user's attempt status and history.
 */

import { NextResponse, NextRequest } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { getUserRevokedStatus } from "@/server/services/userReadService";
import { getPublishedQuizzesWithAttempts } from "@/server/admin/services/adminQuizService";
import { z } from "zod";

const listQuizzesSchema = z.object({
  category: z.string().nullable().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).nullable().optional(),
  page: z.coerce.number().positive().optional().catch(undefined),
  limit: z.coerce.number().positive().optional().catch(undefined),
});

/**
 * GET /api/published-quizzes
 * Returns approved quizzes with user's attempt status and history
 */
export async function GET(req: NextRequest) {
  try {
    // Get user session
    const session = await getAuthSession(req);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if user is revoked
    const isRevoked = await getUserRevokedStatus(session.user.id);
    if (isRevoked) {
      return NextResponse.json(
        { error: "User access revoked" },
        { status: 403 },
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    let data;
    
    try {
      data = listQuizzesSchema.parse({
        category: searchParams.get("category"),
        difficulty: searchParams.get("difficulty"),
        page: searchParams.get("page"),
        limit: searchParams.get("limit"),
      });
    } catch (error) {
      console.error("[GET /api/published-quizzes] Validation error:", error instanceof z.ZodError ? error.issues : error);
      // Fallback to defaults if validation fails
      data = {
        category: searchParams.get("category") || undefined,
        difficulty: searchParams.get("difficulty") || undefined,
        page: 1,
        limit: 10,
      };
    }

    // Get quizzes with user's attempt info from service
    const allQuizzes = await getPublishedQuizzesWithAttempts(
      session.user.id,
      {
        category: data.category,
        difficulty: data.difficulty,
      },
    );

    // Paginate the results
    const page = data.page || 1;
    const limit = data.limit || 10;
    const total = allQuizzes.length;
    const start = (page - 1) * limit;
    const quizzes = allQuizzes.slice(start, start + limit);

    console.log("[GET /api/published-quizzes] Success:", { total, returned: quizzes.length, userId: session.user.id });

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
    // Unexpected errors
    if (error instanceof Error) {
      console.error("[GET /api/published-quizzes] Error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch quizzes", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/quiz/create
 * 
 * Purpose: Create a new quiz game for user
 * Responsibility: SINGLE - Just create game and return ID
 * 
 * Input: { topic, type, amount }
 * Output: { gameId }
 * 
 * Status Codes:
 * - 200: Game created
 * - 400: Invalid input
 * - 401: Not authenticated
 * - 500: Server error
 */

import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { createGameWithTopicCount } from "@/server/services/gameService";
import { quizCreationSchema } from "@/schemas/forms/quiz";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    // Authentication
    const session = await getAuthSession(req);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a game." },
        { status: 401 },
      );
    }

    // Parse and validate input
    const body = await req.json();
    const { topic, type } = quizCreationSchema.parse(body);

    // Execute: Create game record
    const game = await createGameWithTopicCount({
      userId: session.user.id,
      topic,
      type,
    });

    // Return result
    return NextResponse.json({ gameId: game.id }, { status: 200 });
  } catch (error) {
    // Validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 },
      );
    }

    // Unexpected errors
    if (error instanceof Error) {
      console.error("Create game error:", error.message);
      return NextResponse.json(
        { error: "Failed to create game" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

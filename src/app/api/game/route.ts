import { getAuthSession } from "@/lib/nextauth";
import {
  createGameWithTopicCount,
  getGameWithQuestions,
  saveGeneratedQuestionsForGame,
} from "@/server/services/gameService";
import { generateQuestionsByTopic } from "@/server/services/questionGenerationService";
import { quizCreationSchema } from "@/schemas/forms/quiz";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a game." },
        {
          status: 401,
        },
      );
    }
    const body = await req.json();
    const { topic, type, amount } = quizCreationSchema.parse(body);
    const game = await createGameWithTopicCount({
      userId: session.user.id,
      topic,
      type,
    });

    const questions = await generateQuestionsByTopic({
      amount,
      topic,
      type,
    });

    await saveGeneratedQuestionsForGame({
      gameId: game.id,
      type,
      questions,
    });

    return NextResponse.json({ gameId: game.id }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues },
        {
          status: 400,
        },
      );
    } else {
      return NextResponse.json(
        { error: "An unexpected error occurred." },
        {
          status: 500,
        },
      );
    }
  }
}
export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a game." },
        {
          status: 401,
        },
      );
    }
    const url = new URL(req.url);
    const gameId = url.searchParams.get("gameId");
    if (!gameId) {
      return NextResponse.json(
        { error: "You must provide a game id." },
        {
          status: 400,
        },
      );
    }

    const game = await getGameWithQuestions(gameId);
    if (!game) {
      return NextResponse.json(
        { error: "Game not found." },
        {
          status: 404,
        },
      );
    }

    if (!session.user.isAdmin && game.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        {
          status: 403,
        },
      );
    }

    return NextResponse.json(
      { game },
      {
        status: 200,
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      {
        status: 500,
      },
    );
  }
}

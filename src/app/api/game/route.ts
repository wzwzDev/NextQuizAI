import { getAuthSession } from "@/lib/nextauth";
import {
  createGameWithTopicCount,
  getGameWithQuestions,
  saveGeneratedQuestionsForGame,
} from "@/lib/services/gameService";
import { quizCreationSchema } from "@/schemas/forms/quiz";
import { NextResponse } from "next/server";
import { z } from "zod";
import axios from "axios";

type QuestionsApiResponse = {
  questions: Array<
    | {
        question: string;
        answer: string;
        option1: string;
        option2: string;
        option3: string;
      }
    | {
        question: string;
        answer: string;
      }
  >;
};

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
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

    const { data } = await axios.post<QuestionsApiResponse>(
      `${process.env.API_URL as string}/api/questions`,
      {
        amount,
        topic,
        type,
      },
    );

    await saveGeneratedQuestionsForGame({
      gameId: game.id,
      type,
      questions: data.questions,
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
    const session = await getAuthSession();
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

    return NextResponse.json(
      { game },
      {
        status: 400,
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

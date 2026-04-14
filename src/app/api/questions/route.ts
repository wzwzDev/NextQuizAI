import { generateQuestionsByTopic } from "@/lib/services/questionGenerationService";
import { getAuthSession } from "@/server/core/auth";
import { getQuestionsSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
      },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      {
        status: 400,
      },
    );
  }

  try {
    const { amount, topic, type } = getQuestionsSchema.parse(body);
    const questions = await generateQuestionsByTopic({ amount, topic, type });

    return NextResponse.json(
      {
        questions,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      {
        status: 500,
      },
    );
  }
}

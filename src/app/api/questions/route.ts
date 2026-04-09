import { generateQuestionsByTopic } from "@/server/services/questionGenerationService";
import { getQuestionsSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
    } else {
      console.error("elle gpt error", error);
      return NextResponse.json(
        { error: "An unexpected error occurred." },
        {
          status: 500,
        },
      );
    }
  }
}

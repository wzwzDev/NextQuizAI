import { checkAnswerSchema } from "@/schemas/questions";
import { gradeAndSaveAnswer } from "@/lib/services/answerEvaluationService";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json(
      { message: "Invalid JSON" },
      { status: 500 }
    );
  }

  // Check for missing or empty userInput
  if (!body.userInput || body.userInput.trim() === "") {
    return NextResponse.json(
      { message: "userInput is required" },
      { status: 400 }
    );
  }

  try {
    const { questionId, userInput } = checkAnswerSchema.parse(body);
    const result = await gradeAndSaveAnswer(questionId, userInput);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues },
        { status: 400 }
      );
    }
    // Catch-all for unexpected errors
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
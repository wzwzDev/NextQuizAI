import { checkAnswerSchema } from "@/schemas/questions";
import { gradeAndSaveAnswer } from "@/server/services/answerEvaluationService";
import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";

export async function POST(req: Request) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON" },
      { status: 400 },
    );
  }

  const parsedPayload = checkAnswerSchema.safeParse(body);
  if (!parsedPayload.success) {
    return NextResponse.json(
      { message: parsedPayload.error.issues },
      { status: 400 },
    );
  }

  const { questionId, userInput } = parsedPayload.data;
  if (!userInput.trim()) {
    return NextResponse.json(
      { message: "userInput is required" },
      { status: 400 },
    );
  }

  try {
    const result = await gradeAndSaveAnswer(questionId, userInput, {
      userId: session.user.id,
      isAdmin: session.user.isAdmin,
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
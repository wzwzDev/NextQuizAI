import { NextRequest, NextResponse } from "next/server";
import { getApprovedQuiz } from "@/server/services/adminQuizService";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const quizId = searchParams.get("id");

  if (!quizId) {
    return NextResponse.json(
      { error: "Quiz ID is required." },
      { status: 400 },
    );
  }

  try {
    const quiz = await getApprovedQuiz(quizId);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
    }
    return NextResponse.json({ quiz });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load quiz." },
      { status: 500 },
    );
  }
}

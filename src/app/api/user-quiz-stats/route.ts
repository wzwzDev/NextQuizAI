import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import {
  getUserQuizStats,
  saveUserQuizAttempt,
} from "@/server/services/userQuizAttemptService";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId, quizTitle, answers, score } = await req.json();
    const attempt = await saveUserQuizAttempt({
      userId: session.user.id,
      quizId,
      quizTitle,
      answers,
      score,
    });
    return NextResponse.json({ attempt }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save attempt", details: error },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ quizStats: [] });
    }

    const quizStats = await getUserQuizStats(session.user.id);

    return NextResponse.json({ quizStats });
  } catch {
    // Always return valid JSON, even on error
    return NextResponse.json({ quizStats: [] });
  }
}

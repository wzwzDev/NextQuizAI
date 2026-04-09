import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/core/auth";
import {
  getUserQuizStats,
  saveUserQuizAttempt,
} from "@/server/services/userQuizAttemptService";

export async function POST(req: NextRequest) {
  try {
    const { userId, quizId, quizTitle, answers, score } = await req.json();
    const attempt = await saveUserQuizAttempt({
      userId,
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ quizStats: [] });
    }

    const quizStats = await getUserQuizStats(session.user.id);

    return NextResponse.json({ quizStats });
  } catch (error) {
    // Always return valid JSON, even on error
    return NextResponse.json({ quizStats: [] });
  }
}

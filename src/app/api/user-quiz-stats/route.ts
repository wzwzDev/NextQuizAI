import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { saveUserQuizAttemptSchema } from "@/schemas/questions";
import {
  UserQuizAttemptAlreadyCompletedError,
  UserQuizAttemptNotStartedError,
  getUserQuizStats,
  saveUserQuizAttempt,
} from "@/server/services/userQuizAttemptService";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const { quizId, quizTitle, answers, score } = saveUserQuizAttemptSchema.parse(
      body,
    );
    const attempt = await saveUserQuizAttempt({
      userId: session.user.id,
      quizId,
      quizTitle,
      answers,
      score,
    });
    return NextResponse.json({ attempt }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    if (error instanceof UserQuizAttemptAlreadyCompletedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof UserQuizAttemptNotStartedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to save attempt" },
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

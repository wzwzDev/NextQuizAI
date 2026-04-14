import { NextRequest, NextResponse } from "next/server";
import { getApprovedQuiz } from "@/server/admin/services/adminQuizService";
import { getAuthSession } from "@/server/core/auth";
import { submitAdminQuizAttemptSchema } from "@/schemas/questions";
import {
  AdminQuizNotFoundError,
  submitAndGradeAdminQuizAttempt,
} from "@/server/admin/services/adminQuizAttemptService";
import {
  UserQuizAttemptAlreadyCompletedError,
  UserQuizAttemptNotStartedError,
  ensurePendingQuizAttempt,
  getUserQuizAttempt,
} from "@/server/services/userQuizAttemptService";
import { ZodError } from "zod";

function splitOptionChunks(option: string): string[] {
  if (!option) {
    return [];
  }

  return option
    .split(/\r?\n|[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractOptions(value: unknown): string[] {
  if (Array.isArray(value)) {
    const normalized = value
      .filter((item): item is string => typeof item === "string")
      .flatMap(splitOptionChunks);

    return Array.from(new Set(normalized));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const normalized = parsed
          .filter((item): item is string => typeof item === "string")
          .flatMap(splitOptionChunks);

        return Array.from(new Set(normalized));
      }
    } catch {
      // Keep raw string fallback below.
    }

    return Array.from(new Set(splitOptionChunks(trimmed)));
  }

  if (value && typeof value === "object") {
    const values = Object.values(value as Record<string, unknown>)
      .filter((item): item is string => typeof item === "string")
      .flatMap(splitOptionChunks);

    return Array.from(new Set(values));
  }

  return [];
}

export async function GET(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const pendingAttempt = await ensurePendingQuizAttempt({
      userId: session.user.id,
      quizId: quiz.id,
      quizTitle: quiz.title,
    });

    return NextResponse.json({
      attemptStatus: pendingAttempt.status,
      startedAt: pendingAttempt.startedAt,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        category: quiz.category,
        difficulty: quiz.difficulty,
        quizType: quiz.quizType,
        questions: quiz.questions.map((question) => ({
          id: question.id,
          question: question.question,
          options:
            quiz.quizType === "mcq" ? extractOptions(question.options) : [],
        })),
      },
    });
  } catch (error) {
    if (error instanceof UserQuizAttemptAlreadyCompletedError) {
      const existingAttempt = await getUserQuizAttempt(session.user.id, quizId);
      return NextResponse.json(
        {
          error: error.message,
          attemptStatus: "completed",
          score: existingAttempt?.score ?? null,
          completedAt: existingAttempt?.completedAt ?? null,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to load quiz." },
      { status: 500 },
    );
  }
}

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
    const { quizId, answers } = submitAdminQuizAttemptSchema.parse(body);

    const result = await submitAndGradeAdminQuizAttempt({
      quizId,
      answers,
      userId: session.user.id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof AdminQuizNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof UserQuizAttemptAlreadyCompletedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof UserQuizAttemptNotStartedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to submit quiz." },
      { status: 500 },
    );
  }
}

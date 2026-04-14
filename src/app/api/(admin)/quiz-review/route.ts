import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import {
  createApprovedAdminQuiz,
  getAdminQuizzes,
  removeAdminQuiz,
} from "@/server/admin/services/adminQuizService";

export async function POST(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    let { title } = body;
    const { category, difficulty, questions, fileName, quizType } = body;

    // If no title, use fileName without extension, or fallback to "Untitled Quiz"
    if ((!title || title.trim() === "") && fileName) {
      title = fileName.replace(/\.[^/.]+$/, "");
    }
    if (!title || title.trim() === "") {
      title = "Untitled Quiz";
    }

    const quiz = await createApprovedAdminQuiz({
      title,
      fileName,
      category,
      difficulty,
      quizType,
      questions: questions.map(
        (q: {
          question: string;
          answer: string;
          options?: string[];
          citation?: { source: string; snippet: string; confidence?: number };
        }) => ({
          question: q.question,
          answer: q.answer,
          options: Array.isArray(q.options) ? q.options : undefined,
          citation:
            q.citation &&
            typeof q.citation.source === "string" &&
            typeof q.citation.snippet === "string"
              ? {
                  source: q.citation.source,
                  snippet: q.citation.snippet,
                  ...(typeof q.citation.confidence === "number"
                    ? { confidence: q.citation.confidence }
                    : {}),
                }
              : undefined,
        }),
      ),
    });

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to save quiz", details: error },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");

  const quizzes = await getAdminQuizzes({
    category: category ?? undefined,
    difficulty: difficulty ?? undefined,
  });

  return NextResponse.json({ quizzes });
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing quiz id" }, { status: 400 });
  }
  try {
    await removeAdminQuiz(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 },
    );
  }
}

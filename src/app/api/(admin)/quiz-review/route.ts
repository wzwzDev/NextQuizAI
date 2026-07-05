import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import {
  createApprovedAdminQuiz,
  getAdminQuizzes,
  removeAdminQuiz,
} from "@/server/admin/services/adminQuizService";

// Clean AI metadata from question text before storing in database
function cleanQuestionMetadata(question: string): string {
  // Remove everything from "Source:" to the next sentence-ending punctuation or "(Citation"
  // This handles cases where metadata is mixed into the question text
  let cleaned = question.replace(/\s*Source:\s*[^(]*?\(Citation[^)]*\)/gi, "");

  // If "Source:" wasn't in full pattern, try removing just "Source: filename -" prefix
  if (cleaned === question) {
    cleaned = question.replace(/Source:\s*[^-]*\s*-\s*/gi, "");
  }

  // Remove "(Citation confidence: XX%)" or similar patterns
  cleaned = cleaned.replace(/\s*\(Citation\s+confidence:\s*\d+%?\)/gi, "");

  // Remove any remaining "(Citation ...)" patterns
  cleaned = cleaned.replace(/\s*\(Citation[^)]*\)/gi, "");

  // Clean up extra whitespace and line breaks
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

export const dynamic = "force-dynamic";

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
          question: cleanQuestionMetadata(q.question),
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
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10) || 1;
  const limit = Number.parseInt(searchParams.get("limit") ?? "10", 10) || 10;

  const allQuizzes = await getAdminQuizzes({
    category: category ?? undefined,
    difficulty: difficulty ?? undefined,
  });

  const total = Array.isArray(allQuizzes) ? allQuizzes.length : 0;
  const start = (page - 1) * limit;
  const pageItems = Array.isArray(allQuizzes) ? allQuizzes.slice(start, start + limit) : [];

  return NextResponse.json(
    { quizzes: pageItems, total },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
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

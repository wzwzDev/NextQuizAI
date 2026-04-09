import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth";
import {
  createApprovedAdminQuiz,
  getAdminQuizzes,
  removeAdminQuiz,
} from "@/lib/services/adminQuizService";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    let { title, category, difficulty, questions, fileName } = body;

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
      questions: questions.map((q: { question: string; answer: string }) => ({
        question: q.question,
        answer: q.answer,
      })),
    });

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save quiz", details: error },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
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
  const session = await getServerSession(authOptions);
  if (!session?.user) {
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
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 },
    );
  }
}

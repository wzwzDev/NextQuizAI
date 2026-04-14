import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import {
  AiReviewNotFoundError,
  AiReviewValidationError,
  getAiReviewQueue,
  resolveAiReviewItem,
} from "@/server/admin/services/aiReviewService";

export async function GET(req: Request) {
  const session = await getAuthSession(req);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const queue = await getAiReviewQueue();
    return NextResponse.json(queue, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to load AI review queue." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await getAuthSession(req);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
  const questionIndex =
    typeof body.questionIndex === "number" ? body.questionIndex : Number.NaN;
  const action =
    body.action === "accept_ai" ||
    body.action === "mark_incorrect" ||
    body.action === "set_expected_answer"
      ? body.action
      : null;

  if (!attemptId || !Number.isInteger(questionIndex) || !action) {
    return NextResponse.json(
      {
        error:
          "attemptId, questionIndex (integer), and action are required.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await resolveAiReviewItem({
      attemptId,
      questionIndex,
      action,
      correctedAnswer:
        typeof body.correctedAnswer === "string" ? body.correctedAnswer : undefined,
      reviewerId: session.user.id,
      reviewerNote:
        typeof body.reviewerNote === "string" ? body.reviewerNote : undefined,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AiReviewValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof AiReviewNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to resolve AI review item." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { getAiEvaluationMetrics } from "@/server/admin/services/aiReviewService";

export async function GET(req: Request) {
  const session = await getAuthSession(req);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const metrics = await getAiEvaluationMetrics();
    return NextResponse.json(metrics, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to load AI metrics." },
      { status: 500 },
    );
  }
}

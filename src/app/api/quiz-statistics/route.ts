import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/nextauth";
import { getQuizStatisticsSummary } from "@/lib/services/adminQuizService";
export async function GET(req: Request) {
  const session = await getAuthSession(req);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const statistics = await getQuizStatisticsSummary();

  return NextResponse.json(statistics, { status: 200 });
}

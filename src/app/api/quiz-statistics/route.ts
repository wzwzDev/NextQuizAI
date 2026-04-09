import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth";
import { getQuizStatisticsSummary } from "@/lib/services/adminQuizService";
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const statistics = await getQuizStatisticsSummary();

  return NextResponse.json(statistics, { status: 200 });
}

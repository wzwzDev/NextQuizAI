import { endGame } from "@/server/services/gameService";
import { endGameSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { ZodError } from "zod";

export async function POST(req: Request) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  try {
    const { gameId } = endGameSchema.parse(body);
    const result = await endGame(gameId, {
      userId: session.user.id,
      isAdmin: session.user.isAdmin,
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}

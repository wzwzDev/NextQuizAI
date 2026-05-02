import MCQ from "@/components/MCQ";
import { getAuthSession } from "@/server/core/auth";
import { getGameForStatistics } from "@/server/services/statisticsReadService";
import { redirect } from "next/navigation";
import React from "react";
import type { Game, Question } from "@prisma/client";

type Props = {
  params: Promise<{
    gameId: string;
  }>;
};

const MCQPage = async (props: Props) => {
  const params = await props.params;
  const { gameId } = params;

  const session = await getAuthSession();
  const isAdmin = session?.user?.isAdmin === true;
  if (!session?.user && !isAdmin) {
    redirect("/");
  }

  const game = (await getGameForStatistics({
    gameId,
    userId: session.user.id,
    isAdmin,
  })) as (Game & {
    questions: Pick<Question, "id" | "question" | "options">[];
  }) | null;
  if (!game || game.gameType === "open_ended") {
    return redirect("/quiz");
  }
  return <MCQ game={game} />;
};

export default MCQPage;

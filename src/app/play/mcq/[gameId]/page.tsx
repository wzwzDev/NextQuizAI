import MCQComponent from "@/components/MCQ";
import { getAuthSession } from "@/server/core/auth";
import { getGameForStatistics } from "@/server/services/statisticsReadService";
import { getUserRevokedStatus } from "@/server/services/userReadService";
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

  // Check if user is revoked
  if (session.user.id) {
    const isRevoked = await getUserRevokedStatus(session.user.id);
    if (isRevoked) {
      redirect("/revoked");
    }
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
  return <MCQComponent game={game} />;
};

export default MCQPage;

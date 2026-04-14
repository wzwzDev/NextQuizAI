import OpenEnded from "@/components/OpenEnded";
import { prisma } from "@/server/core/db";
import { getAuthSession } from "@/server/core/auth";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  params: Promise<{
    gameId: string;
  }>;
};

const OpenEndedPage = async (props: Props) => {
  const { gameId } = await props.params;
  const session = await getAuthSession();
  const isAdmin = session?.user?.isAdmin === true;
  if (!session?.user && !isAdmin) {
    redirect("/");
  }

  const game = await prisma.game.findFirst({
    where: {
      id: gameId,
      ...(isAdmin ? {} : { userId: session.user.id }),
    },
    include: {
      questions: {
        select: {
          id: true,
          question: true,
          answer: true,
        },
      },
    },
  });
  if (!game || game.gameType === "mcq") {
    return redirect("/quiz");
  }
  return <OpenEnded game={game} />;
};

export default OpenEndedPage;

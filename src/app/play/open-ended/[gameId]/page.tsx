import OpenEnded from "@/components/OpenEnded";
import { getAuthSession } from "@/server/core/auth";
import { getOpenEndedGameForPlay } from "@/server/services/playReadService";
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

  const game = await getOpenEndedGameForPlay({
    gameId,
    userId: session.user.id,
    isAdmin,
  });
  if (!game || game.gameType === "mcq") {
    return redirect("/quiz");
  }
  return <OpenEnded game={game} />;
};

export default OpenEndedPage;

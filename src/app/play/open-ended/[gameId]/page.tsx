import OpenEnded from "@/components/OpenEnded";
import { getAuthSession } from "@/server/core/auth";
import { getOpenEndedGameForPlay } from "@/server/services/playReadService";
import {
  getUserBannedStatusById,
} from "@/server/services/userReadService";
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

  // Check if user is banned
  if (session.user.id) {
    const isBanned = await getUserBannedStatusById(session.user.id);
    if (isBanned) {
      redirect("/banned");
    }
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

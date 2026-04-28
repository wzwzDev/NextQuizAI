import { prisma } from "@/server/core/db";

export async function getGameForStatistics(input: { gameId: string; userId: string; isAdmin: boolean }) {
  return prisma.game.findFirst({
    where: {
      id: input.gameId,
      ...(input.isAdmin ? {} : { userId: input.userId }),
    },
    include: { questions: true },
  });
}

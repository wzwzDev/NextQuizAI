import { prisma } from "@/server/core/db";

export async function getRecentGames(input: { userId: string; limit: number }) {
  return prisma.game.findMany({
    take: input.limit,
    where: {
      userId: input.userId,
    },
    orderBy: {
      timeStarted: "desc",
    },
  });
}

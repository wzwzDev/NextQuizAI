import { prisma } from "@/lib/db";
import { GameType } from "@prisma/client";

export async function createGame(params: {
  userId: string;
  topic: string;
  gameType: GameType;
}) {
  return prisma.game.create({
    data: {
      gameType: params.gameType,
      timeStarted: new Date(),
      userId: params.userId,
      topic: params.topic,
    },
  });
}

export async function findGameById(gameId: string) {
  return prisma.game.findUnique({
    where: { id: gameId },
  });
}

export async function findGameWithQuestionsById(gameId: string) {
  return prisma.game.findUnique({
    where: { id: gameId },
    include: {
      questions: true,
    },
  });
}

export async function markGameEnded(gameId: string) {
  return prisma.game.update({
    where: { id: gameId },
    data: { timeEnded: new Date() },
  });
}
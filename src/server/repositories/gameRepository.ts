import { prisma } from "@/server/core/db";
import { GameType, Prisma } from "@prisma/client";

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

export async function findGameWithQuestionsForUserOrAdmin(
  gameId: string,
  userId: string,
  isAdmin: boolean,
) {
  return prisma.game.findFirst({
    where: {
      id: gameId,
      ...(isAdmin ? {} : { userId: userId }),
    },
    include: { questions: true },
  });
}

export async function findOpenEndedGameForUserOrAdmin(
  gameId: string,
  userId: string,
  isAdmin: boolean,
) {
  return prisma.game.findFirst({
    where: {
      id: gameId,
      ...(isAdmin ? {} : { userId: userId }),
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
}

export async function markGameEnded(gameId: string) {
  return prisma.game.update({
    where: { id: gameId },
    data: { timeEnded: new Date() },
  });
}

export async function createQuestionsForGame(
  manyData: Prisma.QuestionCreateManyInput[],
) {
  return prisma.question.createMany({ data: manyData });
}

export async function findRecentGamesByUserId(userId: string, limit: number) {
  return prisma.game.findMany({
    where: { userId },
    orderBy: { timeStarted: "desc" },
    take: limit,
  });
}

export async function countGamesByUserId(userId: string) {
  return prisma.game.count({ where: { userId } });
}
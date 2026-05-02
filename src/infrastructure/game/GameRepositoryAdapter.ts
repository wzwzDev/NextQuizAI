import type { GameRepositoryPort } from "@/application/ports/out/GameRepositoryPort";
import {
  createQuestionsForGame,
  createGame,
  findGameById,
  findGameWithQuestionsById,
  findGameWithQuestionsForUserOrAdmin,
  findOpenEndedGameForUserOrAdmin,
  findRecentGamesByUserId,
  countGamesByUserId,
  markGameEnded,
} from "@/server/repositories/gameRepository";
import { incrementTopicCount } from "@/server/repositories/topicRepository";
import { GameType, Prisma } from "@prisma/client";

export class GameRepositoryAdapter implements GameRepositoryPort {
  async createGame(params: {
    userId: string;
    topic: string;
    gameType: GameType;
  }) {
    return createGame(params);
  }

  async findGameById(gameId: string) {
    return findGameById(gameId);
  }

  async endGame(gameId: string) {
    await markGameEnded(gameId);
  }

  async trackTopic(topic: string) {
    await incrementTopicCount(topic);
  }

  async createQuestionsForGame(manyData: Prisma.QuestionCreateManyInput[]) {
    await createQuestionsForGame(manyData);
  }

  async findGameWithQuestionsById(gameId: string) {
    return findGameWithQuestionsById(gameId);
  }

  async findRecentGamesByUserId(userId: string, limit: number) {
    return findRecentGamesByUserId(userId, limit);
  }

  async countGamesByUserId(userId: string) {
    return countGamesByUserId(userId);
  }

  async findGameWithQuestionsForUserOrAdmin(
    gameId: string,
    userId: string,
    isAdmin: boolean,
  ) {
    return findGameWithQuestionsForUserOrAdmin(gameId, userId, isAdmin);
  }

  async findOpenEndedGameForUserOrAdmin(
    gameId: string,
    userId: string,
    isAdmin: boolean,
  ) {
    return findOpenEndedGameForUserOrAdmin(gameId, userId, isAdmin);
  }
}

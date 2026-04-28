import type { GameRepositoryPort } from "@/application/ports/out/GameRepositoryPort";
import {
  createGame,
  findGameById,
  markGameEnded,
} from "@/server/repositories/gameRepository";
import { incrementTopicCount } from "@/server/repositories/topicRepository";
import { GameType } from "@prisma/client";

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
}

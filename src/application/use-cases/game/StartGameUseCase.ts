import type { GameRepositoryPort } from "@/application/ports/out/GameRepositoryPort";
import { GameType } from "@prisma/client";

export class StartGameUseCase {
  constructor(private gameRepository: GameRepositoryPort) {}

  async execute(input: {
    userId: string;
    topic: string;
    type: GameType;
  }): Promise<{
    id: string;
    userId: string;
    topic: string;
    gameType: GameType;
    timeStarted: Date;
  }> {
    // Create game
    const game = await this.gameRepository.createGame({
      userId: input.userId,
      topic: input.topic,
      gameType: input.type,
    });

    // Track topic for analytics
    await this.gameRepository.trackTopic(input.topic);

    return game;
  }
}

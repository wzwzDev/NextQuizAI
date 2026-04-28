import { GameType } from "@prisma/client";

export interface GameRepositoryPort {
  /**
   * Create a new game
   */
  createGame(params: {
    userId: string;
    topic: string;
    gameType: GameType;
  }): Promise<{
    id: string;
    userId: string;
    topic: string;
    gameType: GameType;
    timeStarted: Date;
  }>;

  /**
   * Find a game by ID
   */
  findGameById(gameId: string): Promise<{
    id: string;
    userId: string;
    topic: string;
    gameType: GameType;
    timeStarted: Date;
    timeEnded: Date | null;
  } | null>;

  /**
   * End a game (mark as complete)
   */
  endGame(gameId: string): Promise<void>;

  /**
   * Track that a topic was played
   */
  trackTopic(topic: string): Promise<void>;
}

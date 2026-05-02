import { GameType } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { Game } from "@prisma/client";

export interface GameRepositoryPort {
  /**
   * Create a new game
   */
  createGame(params: {
    userId: string;
    topic: string;
    gameType: GameType;
  }): Promise<Game>;

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

  /**
   * Persist generated questions for a game.
   */
  createQuestionsForGame(manyData: Prisma.QuestionCreateManyInput[]): Promise<void>;

  /**
   * Find a game with all questions attached.
   */
  findGameWithQuestionsById(gameId: string): Promise<{
    id: string;
    userId: string;
    topic: string;
    gameType: GameType;
    questions: unknown[];
  } | null>;

  /**
   * Read recent games for a user.
   */
  findRecentGamesByUserId(userId: string, limit: number): Promise<unknown[]>;

  /**
   * Count total games by user.
   */
  countGamesByUserId(userId: string): Promise<number>;

  /**
   * Read game details for statistics depending on ownership/admin rights.
   */
  findGameWithQuestionsForUserOrAdmin(
    gameId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<unknown | null>;

  /**
   * Read open-ended game questions depending on ownership/admin rights.
   */
  findOpenEndedGameForUserOrAdmin(
    gameId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<unknown | null>;
}

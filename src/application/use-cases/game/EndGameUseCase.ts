import type { GameRepositoryPort } from "@/application/ports/out/GameRepositoryPort";
import type { PermissionCheckPort } from "@/application/ports/out/PermissionCheckPort";

export class GameNotFoundError extends Error {
  constructor() {
    super("Game not found.");
    this.name = "GameNotFoundError";
  }
}

export class GameAccessForbiddenError extends Error {
  constructor() {
    super("You do not have permission to end this game.");
    this.name = "GameAccessForbiddenError";
  }
}

export class EndGameUseCase {
  constructor(
    private gameRepository: GameRepositoryPort,
    private permissionCheck: PermissionCheckPort,
  ) {}

  async execute(input: {
    gameId: string;
    userId?: string;
    isAdmin?: boolean;
  }): Promise<void> {
    // Find the game
    const game = await this.gameRepository.findGameById(input.gameId);
    if (!game) {
      throw new GameNotFoundError();
    }

    // Check permissions
    if (input.userId) {
      const canAccess = this.permissionCheck.canUserAccessResource(
        input.userId,
        game.userId,
        input.isAdmin === true,
      );

      if (!canAccess) {
        throw new GameAccessForbiddenError();
      }
    }

    // End the game
    await this.gameRepository.endGame(input.gameId);
  }
}

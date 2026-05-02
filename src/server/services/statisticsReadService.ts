import { GameRepositoryAdapter } from "@/infrastructure/game/GameRepositoryAdapter";

const gameRepository = new GameRepositoryAdapter();

export async function getGameForStatistics(input: { gameId: string; userId: string; isAdmin: boolean }) {
  return gameRepository.findGameWithQuestionsForUserOrAdmin(
    input.gameId,
    input.userId,
    input.isAdmin,
  );
}

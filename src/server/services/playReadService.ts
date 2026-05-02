import { GameRepositoryAdapter } from "@/infrastructure/game/GameRepositoryAdapter";

const gameRepository = new GameRepositoryAdapter();

export async function getOpenEndedGameForPlay(input: {
  gameId: string;
  userId: string;
  isAdmin: boolean;
}) {
  return gameRepository.findOpenEndedGameForUserOrAdmin(
    input.gameId,
    input.userId,
    input.isAdmin,
  );
}

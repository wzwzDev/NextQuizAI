import { GameRepositoryAdapter } from "@/infrastructure/game/GameRepositoryAdapter";

const gameRepository = new GameRepositoryAdapter();

export async function getRecentGames(input: { userId: string; limit: number }) {
  return gameRepository.findRecentGamesByUserId(input.userId, input.limit);
}

export async function getTotalGamesCount(userId: string) {
  return gameRepository.countGamesByUserId(userId);
}

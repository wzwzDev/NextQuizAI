import { findRecentGamesByUserId } from "@/server/repositories/gameRepository";

export async function getRecentGames(input: { userId: string; limit: number }) {
  return findRecentGamesByUserId(input.userId, input.limit);
}

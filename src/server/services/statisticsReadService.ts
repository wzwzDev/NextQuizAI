import { findGameWithQuestionsForUserOrAdmin } from "@/server/repositories/gameRepository";

export async function getGameForStatistics(input: { gameId: string; userId: string; isAdmin: boolean }) {
  return findGameWithQuestionsForUserOrAdmin(input.gameId, input.userId, input.isAdmin);
}

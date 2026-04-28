import { findOpenEndedGameForUserOrAdmin } from "@/server/repositories/gameRepository";

export async function getOpenEndedGameForPlay(input: {
  gameId: string;
  userId: string;
  isAdmin: boolean;
}) {
  return findOpenEndedGameForUserOrAdmin(input.gameId, input.userId, input.isAdmin);
}

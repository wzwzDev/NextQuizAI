const mockGameRepository = {
  findRecentGamesByUserId: jest.fn(),
  countGamesByUserId: jest.fn(),
  findGameWithQuestionsForUserOrAdmin: jest.fn(),
  findOpenEndedGameForUserOrAdmin: jest.fn(),
};

const mockUserRepository = {
  findRevokeStatus: jest.fn(),
  findBanStatusByEmail: jest.fn(),
};

const mockTopicRepository = {
  listAll: jest.fn(),
};

jest.mock("@/infrastructure/game/GameRepositoryAdapter", () => ({
  GameRepositoryAdapter: jest.fn(() => mockGameRepository),
}));

jest.mock("@/infrastructure/user/UserRepositoryAdapter", () => ({
  UserRepositoryAdapter: jest.fn(() => mockUserRepository),
}));

jest.mock("@/infrastructure/topic/TopicRepositoryAdapter", () => ({
  TopicRepositoryAdapter: jest.fn(() => mockTopicRepository),
}));

import {
  getRecentGames,
  getTotalGamesCount,
} from "@/server/services/historyReadService";
import { getGameForStatistics } from "@/server/services/statisticsReadService";
import { getOpenEndedGameForPlay } from "@/server/services/playReadService";
import {
  getUserBannedStatusByEmail,
  getUserRevokedStatus,
} from "@/server/services/userReadService";
import { getHotTopics } from "@/server/services/topicReadService";

describe("read services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates recent game reads", async () => {
    const games = [{ id: "g1" }];
    mockGameRepository.findRecentGamesByUserId.mockResolvedValue(games);

    const result = await getRecentGames({ userId: "u1", limit: 5 });

    expect(mockGameRepository.findRecentGamesByUserId).toHaveBeenCalledWith("u1", 5);
    expect(result).toEqual(games);
  });

  it("delegates game count reads", async () => {
    mockGameRepository.countGamesByUserId.mockResolvedValue(7);

    const result = await getTotalGamesCount("u1");

    expect(mockGameRepository.countGamesByUserId).toHaveBeenCalledWith("u1");
    expect(result).toBe(7);
  });

  it("delegates statistics game reads", async () => {
    const game = { id: "g1", questions: [] };
    mockGameRepository.findGameWithQuestionsForUserOrAdmin.mockResolvedValue(game);

    const result = await getGameForStatistics({
      gameId: "g1",
      userId: "u1",
      isAdmin: false,
    });

    expect(mockGameRepository.findGameWithQuestionsForUserOrAdmin).toHaveBeenCalledWith(
      "g1",
      "u1",
      false,
    );
    expect(result).toEqual(game);
  });

  it("delegates open-ended play reads", async () => {
    const game = { id: "g2", questions: [{ id: "q1" }] };
    mockGameRepository.findOpenEndedGameForUserOrAdmin.mockResolvedValue(game);

    const result = await getOpenEndedGameForPlay({
      gameId: "g2",
      userId: "u2",
      isAdmin: true,
    });

    expect(mockGameRepository.findOpenEndedGameForUserOrAdmin).toHaveBeenCalledWith(
      "g2",
      "u2",
      true,
    );
    expect(result).toEqual(game);
  });

  it("maps revoked status boolean", async () => {
    mockUserRepository.findRevokeStatus.mockResolvedValue({ revoked: true });
    await expect(getUserRevokedStatus("u1")).resolves.toBe(true);

    mockUserRepository.findRevokeStatus.mockResolvedValue(null);
    await expect(getUserRevokedStatus("u1")).resolves.toBe(false);
  });

  it("maps banned status by email boolean", async () => {
    mockUserRepository.findBanStatusByEmail.mockResolvedValue({ banned: true });
    await expect(getUserBannedStatusByEmail("user@example.com")).resolves.toBe(true);

    mockUserRepository.findBanStatusByEmail.mockResolvedValue(null);
    await expect(getUserBannedStatusByEmail("user@example.com")).resolves.toBe(false);
  });

  it("delegates hot topics reads", async () => {
    const topics = [{ topic: "math", count: 3 }];
    mockTopicRepository.listAll.mockResolvedValue(topics);

    const result = await getHotTopics();

    expect(mockTopicRepository.listAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(topics);
  });
});

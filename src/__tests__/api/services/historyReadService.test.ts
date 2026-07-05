jest.mock('@/infrastructure/game/GameRepositoryAdapter', () => {
  return {
    GameRepositoryAdapter: jest.fn().mockImplementation(() => ({
      findRecentGamesByUserId: jest.fn().mockResolvedValue([
        { id: 'g1', topic: 'math', gameType: 'mcq', timeEnded: new Date().toISOString() },
      ]),
      countGamesByUserId: jest.fn().mockResolvedValue(1),
    })),
  };
});

import { getRecentGames, getTotalGamesCount } from '@/server/services/historyReadService';

describe('historyReadService', () => {
  test('getRecentGames returns recent games with expected fields', async () => {
    const games = await getRecentGames({ userId: 'u1', limit: 10 });
    expect(Array.isArray(games)).toBe(true);
    expect(games[0]).toHaveProperty('id', 'g1');
    expect(games[0]).toHaveProperty('topic', 'math');
  });

  test('getTotalGamesCount returns a number', async () => {
    const count = await getTotalGamesCount('u1');
    expect(typeof count).toBe('number');
  });
});

jest.mock('@/infrastructure/topic/TopicRepositoryAdapter', () => {
  return {
    TopicRepositoryAdapter: jest.fn().mockImplementation(() => ({
      listAll: jest.fn().mockResolvedValue([{ topic: 'math', count: 5 }]),
    })),
  };
});

import { getHotTopics } from '@/server/services/topicReadService';

describe('topicReadService', () => {
  test('getHotTopics returns list of {topic,count}', async () => {
    const topics = await getHotTopics();
    expect(Array.isArray(topics)).toBe(true);
    expect(topics[0]).toHaveProperty('topic', 'math');
    expect(topics[0]).toHaveProperty('count', 5);
  });
});

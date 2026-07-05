import { TopicRepositoryAdapter } from "@/infrastructure/topic/TopicRepositoryAdapter";
import * as topicRepository from "@/server/repositories/topicRepository";

jest.mock("@/server/repositories/topicRepository");

describe("TopicRepositoryAdapter", () => {
  let adapter: TopicRepositoryAdapter;

  beforeEach(() => {
    adapter = new TopicRepositoryAdapter();
    jest.clearAllMocks();
  });

  describe("increment", () => {
    it("should increment topic count", async () => {
      (topicRepository.incrementTopicCount as jest.Mock).mockResolvedValue(undefined);

      await adapter.increment("Science");

      expect(topicRepository.incrementTopicCount).toHaveBeenCalledWith("Science");
    });

    it("should handle different topics", async () => {
      (topicRepository.incrementTopicCount as jest.Mock).mockResolvedValue(undefined);

      await adapter.increment("Science");
      await adapter.increment("Math");
      await adapter.increment("History");

      expect(topicRepository.incrementTopicCount).toHaveBeenCalledTimes(3);
      expect(topicRepository.incrementTopicCount).toHaveBeenNthCalledWith(1, "Science");
      expect(topicRepository.incrementTopicCount).toHaveBeenNthCalledWith(2, "Math");
      expect(topicRepository.incrementTopicCount).toHaveBeenNthCalledWith(3, "History");
    });

    it("should handle special characters in topic", async () => {
      (topicRepository.incrementTopicCount as jest.Mock).mockResolvedValue(undefined);

      await adapter.increment("C++");

      expect(topicRepository.incrementTopicCount).toHaveBeenCalledWith("C++");
    });

    it("should handle empty string topic", async () => {
      (topicRepository.incrementTopicCount as jest.Mock).mockResolvedValue(undefined);

      await adapter.increment("");

      expect(topicRepository.incrementTopicCount).toHaveBeenCalledWith("");
    });

    it("should handle increment errors", async () => {
      (topicRepository.incrementTopicCount as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(adapter.increment("Science")).rejects.toThrow("Database error");
    });
  });

  describe("listAll", () => {
    it("should list all topics with counts", async () => {
      const mockTopics = [
        { topic: "Science", count: 10 },
        { topic: "Math", count: 25 },
        { topic: "History", count: 15 },
      ];

      (topicRepository.listTopicCounts as jest.Mock).mockResolvedValue(mockTopics);

      const result = await adapter.listAll();

      expect(result).toEqual([
        { topic: "Science", count: 10 },
        { topic: "Math", count: 25 },
        { topic: "History", count: 15 },
      ]);
      expect(result).toHaveLength(3);
      expect(topicRepository.listTopicCounts).toHaveBeenCalled();
    });

    it("should return empty array when no topics", async () => {
      (topicRepository.listTopicCounts as jest.Mock).mockResolvedValue([]);

      const result = await adapter.listAll();

      expect(result).toEqual([]);
    });

    it("should map topic data correctly", async () => {
      const mockTopics = [
        { topic: "Programming", count: 100 },
        { topic: "Design", count: 50 },
      ];

      (topicRepository.listTopicCounts as jest.Mock).mockResolvedValue(mockTopics);

      const result = await adapter.listAll();

      expect(result[0].topic).toBe("Programming");
      expect(result[0].count).toBe(100);
      expect(result[1].topic).toBe("Design");
      expect(result[1].count).toBe(50);
    });

    it("should handle single topic", async () => {
      const mockTopics = [{ topic: "SingleTopic", count: 5 }];

      (topicRepository.listTopicCounts as jest.Mock).mockResolvedValue(mockTopics);

      const result = await adapter.listAll();

      expect(result).toHaveLength(1);
      expect(result[0].topic).toBe("SingleTopic");
    });

    it("should handle large count values", async () => {
      const mockTopics = [
        { topic: "PopularTopic", count: 999999 },
        { topic: "RareTopic", count: 1 },
      ];

      (topicRepository.listTopicCounts as jest.Mock).mockResolvedValue(mockTopics);

      const result = await adapter.listAll();

      expect(result[0].count).toBe(999999);
      expect(result[1].count).toBe(1);
    });

    it("should handle zero count", async () => {
      const mockTopics = [{ topic: "UnusedTopic", count: 0 }];

      (topicRepository.listTopicCounts as jest.Mock).mockResolvedValue(mockTopics);

      const result = await adapter.listAll();

      expect(result[0].count).toBe(0);
    });

    it("should handle list errors", async () => {
      (topicRepository.listTopicCounts as jest.Mock).mockRejectedValue(
        new Error("Failed to fetch topics")
      );

      await expect(adapter.listAll()).rejects.toThrow("Failed to fetch topics");
    });

    it("should preserve order of topics", async () => {
      const mockTopics = [
        { topic: "Z-Topic", count: 1 },
        { topic: "A-Topic", count: 2 },
        { topic: "M-Topic", count: 3 },
      ];

      (topicRepository.listTopicCounts as jest.Mock).mockResolvedValue(mockTopics);

      const result = await adapter.listAll();

      expect(result[0].topic).toBe("Z-Topic");
      expect(result[1].topic).toBe("A-Topic");
      expect(result[2].topic).toBe("M-Topic");
    });
  });
});

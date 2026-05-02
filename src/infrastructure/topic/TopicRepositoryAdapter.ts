import type { TopicRepositoryPort } from "@/application/ports/out/TopicRepositoryPort";
import {
  incrementTopicCount,
  listTopicCounts,
} from "@/server/repositories/topicRepository";

export class TopicRepositoryAdapter implements TopicRepositoryPort {
  async increment(topic: string): Promise<void> {
    await incrementTopicCount(topic);
  }

  async listAll() {
    const topics = await listTopicCounts();
    return topics.map((topic) => ({ topic: topic.topic, count: topic.count }));
  }
}
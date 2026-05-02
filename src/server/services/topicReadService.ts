import { TopicRepositoryAdapter } from "@/infrastructure/topic/TopicRepositoryAdapter";

const topicRepository = new TopicRepositoryAdapter();

export async function getHotTopics() {
  return topicRepository.listAll();
}
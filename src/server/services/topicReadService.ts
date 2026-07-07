import { TopicRepositoryAdapter } from "@/infrastructure/topic/TopicRepositoryAdapter";

const topicRepository = new TopicRepositoryAdapter();

export async function getHotTopics() {
  const topics = await topicRepository.listAll();
  console.log("[getHotTopics] Retrieved topics:", topics);
  return topics;
}
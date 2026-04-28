export interface TopicRepositoryPort {
  increment(topic: string): Promise<void>;
}

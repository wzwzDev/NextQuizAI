export interface TopicRepositoryPort {
  increment(topic: string): Promise<void>;
  listAll(): Promise<Array<{ topic: string; count: number }>>;
}

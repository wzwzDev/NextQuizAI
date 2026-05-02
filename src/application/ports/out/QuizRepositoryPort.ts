import type { Quiz } from "@/domain/entities/Quiz";

export interface QuizRepositoryPort {
  findApprovedById(id: number): Promise<Quiz | null>;
}

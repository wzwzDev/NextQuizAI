export interface QuizRepositoryPort {
  findApprovedById(
    id: string,
  ): Promise<{ id: string; title: string; quizType: "mcq" | "open_ended" } | null>;
}

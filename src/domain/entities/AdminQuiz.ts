import type { GameType } from "@/domain/value-objects/DomainEnums";
import { AdminQuizQuestion } from "./AdminQuizQuestion";

export class AdminQuiz {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly category: string,
    public readonly difficulty: string,
    public readonly quizType: GameType,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly questions: AdminQuizQuestion[],
  ) {}

  static fromPrisma(p: unknown) {
    if (!p) return null;
    const d = p as unknown as Record<string, unknown>;
    const rawQuestions = (d["questions"] as unknown[]) ?? [];
    const questions = rawQuestions
      .map((q) => AdminQuizQuestion.fromPrisma(q))
      .filter((q): q is AdminQuizQuestion => q !== null);

    return new AdminQuiz(
      String(d["id"] ?? ""),
      String(d["title"] ?? ""),
      String(d["category"] ?? ""),
      String(d["difficulty"] ?? ""),
      (d["quizType"] as GameType) ?? ("open_ended" as GameType),
      String(d["status"] ?? ""),
      new Date(String(d["createdAt"] ?? Date.now())),
      new Date(String(d["updatedAt"] ?? Date.now())),
      questions,
    );
  }
}

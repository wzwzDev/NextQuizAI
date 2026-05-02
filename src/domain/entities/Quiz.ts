import { QuizQuestion } from "./QuizQuestion";

export class Quiz {
  constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly category: string,
    public readonly difficulty: string,
    public readonly questions: QuizQuestion[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static fromPrisma(p: unknown) {
    if (!p) return null;
    const d = p as unknown as Record<string, unknown>;
    const rawQuestions = (d["questions"] as unknown[]) ?? [];
    const questions = rawQuestions
      .map((q) => QuizQuestion.fromPrisma(q))
      .filter((q): q is QuizQuestion => q !== null);

    return new Quiz(
      Number(d["id"] ?? 0),
      String(d["title"] ?? ""),
      String(d["category"] ?? ""),
      String(d["difficulty"] ?? ""),
      questions,
      new Date(String(d["createdAt"] ?? Date.now())),
      new Date(String(d["updatedAt"] ?? Date.now())),
    );
  }
}
